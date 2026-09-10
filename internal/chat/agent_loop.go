package chat

import (
	"context"
	"fmt"
	"log"
	"time"
	"sourcebook/internal/llm"
	"sourcebook/internal/vector"
)

type AgentLoop struct {
	evaluator *SelfEvaluator
	tools     *ToolRegistry
	llmClient *llm.Client
	planner   *QueryPlanner
}

func NewAgentLoop(vc *vector.Client, retriever *Retriever, client *llm.Client, planner *QueryPlanner) *AgentLoop {
	return &AgentLoop{
		evaluator: NewSelfEvaluator(vc),
		tools:     NewToolRegistry(retriever),
		llmClient: client,
		planner:   planner,
	}
}

// Run executes the graph-based multi-iteration ReAct (Reasoning + Tool Calling) loop with adaptive query reformulation.
func (al *AgentLoop) Run(
	ctx context.Context,
	query string,
	notebookID string,
	initialDocs []Document,
	onStatus func(string),
) ([]Document, *ExecutionGraphTracer, error) {
	tracer := NewExecutionGraphTracer()
	startTime := time.Now()

	if onStatus != nil {
		onStatus("[State: EVALUATE] Evaluating context relevance & sufficiency...")
	}

	tracer.LogStep(StateInit, "Initializing agentic graph loop", "init", query, len(initialDocs), 0)

	// 1. Initial Evaluation Node
	evalStart := time.Now()
	eval, err := al.evaluator.EvaluateContext(ctx, query, initialDocs)
	evalDuration := time.Since(evalStart).Milliseconds()

	if err != nil {
		log.Printf("[AgentLoop] Evaluation error: %v", err)
		eval = &EvaluationResult{RelevantDocs: initialDocs, Sufficient: len(initialDocs) > 0}
	}

	tracer.LogStep(StateEvaluate, fmt.Sprintf("Evaluated context sufficiency: %v (avg score: %.2f)", eval.Sufficient, eval.AverageScore),
		"evaluate_context", query, len(eval.RelevantDocs), evalDuration)

	// If initial docs are fully sufficient, return immediately
	if eval.Sufficient && len(eval.RelevantDocs) > 0 {
		if onStatus != nil {
			onStatus(fmt.Sprintf("[State: FINISH] Verified sufficient context (%d high-relevance sources)", len(eval.RelevantDocs)))
		}
		tracer.LogStep(StateFinish, "Sufficient context verified", "finish", "", len(eval.RelevantDocs), time.Since(startTime).Milliseconds())
		return eval.RelevantDocs, tracer, nil
	}

	// Collected documents & attempted queries
	collectedDocs := eval.RelevantDocs
	attemptedQueries := []string{query}

	// Adaptive query reformulation node if docs are poor
	if len(collectedDocs) == 0 {
		reformStart := time.Now()
		reformulated := ReformulateQuery(ctx, al.planner, query, attemptedQueries)
		attemptedQueries = append(attemptedQueries, reformulated)
		tracer.LogStep(StateReformulate, "Reformulated query due to low context", "reformulate_query", reformulated, 0, time.Since(reformStart).Milliseconds())
		if onStatus != nil {
			onStatus(fmt.Sprintf("[State: REFORMULATE] Adaptive query reformulation: %q", reformulated))
		}
	}

	// Start agentic chat history specifically for the ReAct loop
	agentHistory := []llm.Message{
		{Role: "system", Content: ReActSystemPrompt},
	}

	// Seed with initial query and initial documents as context
	initialContextPrompt := fmt.Sprintf("User Query: %s\n\nInitial Docs:\n", query)
	for i, d := range collectedDocs {
		initialContextPrompt += fmt.Sprintf("[%d] Title: %s\nContent: %s\n\n", i+1, d.Title, d.Content)
	}
	agentHistory = append(agentHistory, llm.Message{Role: "user", Content: initialContextPrompt})

	maxIter := 3
	for i := 0; i < maxIter; i++ {
		stepStart := time.Now()
		if onStatus != nil {
			onStatus(fmt.Sprintf("[State: REASON] Agent thinking (Graph Step %d/%d)...", i+1, maxIter))
		}

		rawRes, err := al.llmClient.Generate(ctx, agentHistory)
		if err != nil {
			log.Printf("[AgentLoop] LLM turn generation failed: %v", err)
			break
		}

		agentHistory = append(agentHistory, llm.Message{Role: "assistant", Content: rawRes})

		reactRes, err := ParseReActJSON(rawRes)
		if err != nil {
			log.Printf("[AgentLoop] Failed to parse JSON response: %v. Raw: %q. Exiting loop.", err, rawRes)
			tracer.LogStep(StateReason, "JSON parse error", "parse_failed", rawRes, len(collectedDocs), time.Since(stepStart).Milliseconds())
			if onStatus != nil {
				onStatus("Error parsing agent decision JSON. Synthesizing with current docs...")
			}
			break
		}

		tracer.LogStep(StateReason, reactRes.Thought, reactRes.Action, reactRes.ActionInput, len(collectedDocs), time.Since(stepStart).Milliseconds())

		if reactRes.Action == "finish" || reactRes.Action == "" {
			if onStatus != nil {
				onStatus("[State: FINISH] Agent finished gathering information. Ready to synthesize.")
			}
			tracer.LogStep(StateFinish, reactRes.Thought, "finish", "", len(collectedDocs), time.Since(stepStart).Milliseconds())
			break
		}

		// Stream action status to UI
		if onStatus != nil {
			onStatus(fmt.Sprintf("[State: EXECUTE_TOOL] Executing %s(%q)...", reactRes.Action, reactRes.ActionInput))
		}

		// Execute tool node
		toolStart := time.Now()
		var docs []Document
		switch reactRes.Action {
		case "search_web":
			docs, err = al.tools.ToolWebSearch(ctx, reactRes.ActionInput, 5)
		case "search_notebook":
			docs, err = al.tools.ToolNotebookSearch(ctx, notebookID, reactRes.ActionInput)
		case "fetch_arxiv":
			doc, err := al.tools.ToolArxivFetch(ctx, reactRes.ActionInput)
			if err == nil && doc != nil {
				docs = []Document{*doc}
			}
		default:
			err = fmt.Errorf("unknown action: %s", reactRes.Action)
		}

		toolDuration := time.Since(toolStart).Milliseconds()

		if err != nil {
			log.Printf("[AgentLoop] Tool execution failed: %v", err)
			tracer.LogStep(StateExecuteTool, fmt.Sprintf("Tool error: %v", err), reactRes.Action, reactRes.ActionInput, 0, toolDuration)
			agentHistory = append(agentHistory, llm.Message{
				Role:    "user",
				Content: fmt.Sprintf("Observation: Tool failed with error: %v", err),
			})
			continue
		}

		tracer.LogStep(StateExecuteTool, fmt.Sprintf("Fetched %d documents", len(docs)), reactRes.Action, reactRes.ActionInput, len(docs), toolDuration)

		collectedDocs = append(collectedDocs, docs...)
		collectedDocs = Deduplicate(collectedDocs)

		obsPrompt := fmt.Sprintf("Observation: Tool returned %d documents.\n", len(docs))
		for idx, d := range docs {
			obsPrompt += fmt.Sprintf("[%d] Title: %s\nContent: %s\n\n", idx+1, d.Title, d.Content)
		}

		agentHistory = append(agentHistory, llm.Message{Role: "user", Content: obsPrompt})
	}

	return collectedDocs, tracer, nil
}
