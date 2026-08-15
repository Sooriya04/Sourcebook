package chat

import (
	"context"
	"fmt"
	"log"
	"sourcebook/internal/llm"
	"sourcebook/internal/vector"
)

type AgentLoop struct {
	evaluator *SelfEvaluator
	tools     *ToolRegistry
	llmClient *llm.Client
}

func NewAgentLoop(vc *vector.Client, retriever *Retriever, client *llm.Client) *AgentLoop {
	return &AgentLoop{
		evaluator: NewSelfEvaluator(vc),
		tools:     NewToolRegistry(retriever),
		llmClient: client,
	}
}

// Run executes the multi-iteration ReAct (Reasoning + Tool Calling) loop.
func (al *AgentLoop) Run(
	ctx context.Context,
	query string,
	notebookID string,
	initialDocs []Document,
	onStatus func(string),
) ([]Document, error) {
	if onStatus != nil {
		onStatus("Evaluating source quality and relevance...")
	}

	// 1. Initial Evaluation
	eval, err := al.evaluator.EvaluateContext(ctx, query, initialDocs)
	if err != nil {
		log.Printf("[AgentLoop] Evaluation error: %v", err)
		eval = &EvaluationResult{RelevantDocs: initialDocs, Sufficient: len(initialDocs) > 0}
	}

	// If initial docs are fully sufficient, return them immediately (zero extra steps)
	if eval.Sufficient && len(eval.RelevantDocs) > 0 {
		if onStatus != nil {
			onStatus(fmt.Sprintf("Sufficient context verified (%d high-relevance sources)", len(eval.RelevantDocs)))
		}
		return eval.RelevantDocs, nil
	}

	// Prepare collected documents
	collectedDocs := eval.RelevantDocs

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
		if onStatus != nil {
			onStatus(fmt.Sprintf("Agent thinking (Step %d/%d)...", i+1, maxIter))
		}

		rawRes, err := al.llmClient.Generate(ctx, agentHistory)
		if err != nil {
			log.Printf("[AgentLoop] LLM turn generation failed: %v", err)
			break
		}

		// Keep track of agent response in messages history
		agentHistory = append(agentHistory, llm.Message{Role: "assistant", Content: rawRes})

		reactRes, err := ParseReActJSON(rawRes)
		if err != nil {
			log.Printf("[AgentLoop] Failed to parse JSON response: %v. Raw: %q. Exiting loop.", err, rawRes)
			if onStatus != nil {
				onStatus("Error parsing agent decision JSON. Synthesizing with current docs...")
			}
			break
		}

		log.Printf("[AgentLoop] Step %d: Thought: %q, Action: %q, ActionInput: %q",
			i+1, reactRes.Thought, reactRes.Action, reactRes.ActionInput)

		if reactRes.Action == "finish" || reactRes.Action == "" {
			if onStatus != nil {
				onStatus("Agent finished gathering information. Ready to synthesize.")
			}
			break
		}

		// Stream action status to UI
		if onStatus != nil {
			onStatus(fmt.Sprintf("Agent action: %s(%q)...", reactRes.Action, reactRes.ActionInput))
		}

		// Execute tools
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

		if err != nil {
			log.Printf("[AgentLoop] Tool execution failed: %v", err)
			agentHistory = append(agentHistory, llm.Message{
				Role:    "user",
				Content: fmt.Sprintf("Observation: Tool failed with error: %v", err),
			})
			continue
		}

		collectedDocs = append(collectedDocs, docs...)
		collectedDocs = Deduplicate(collectedDocs)

		// Create dynamic observation string
		obsPrompt := fmt.Sprintf("Observation: Tool returned %d documents.\n", len(docs))
		for idx, d := range docs {
			obsPrompt += fmt.Sprintf("[%d] Title: %s\nContent: %s\n\n", idx+1, d.Title, d.Content)
		}

		agentHistory = append(agentHistory, llm.Message{Role: "user", Content: obsPrompt})
	}

	return collectedDocs, nil
}
