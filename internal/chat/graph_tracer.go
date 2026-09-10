package chat

import (
	"context"
	"fmt"
	"log"
	"time"
)

// GraphState defines the state name in the execution graph.
type GraphState string

const (
	StateInit           GraphState = "INIT"
	StateEvaluate       GraphState = "EVALUATE"
	StateReformulate    GraphState = "REFORMULATE"
	StateReason         GraphState = "REASON"
	StateExecuteTool    GraphState = "EXECUTE_TOOL"
	StateSynthesize     GraphState = "SYNTHESIZE"
	StateFinish         GraphState = "FINISH"
)

// TraceStep records a single state transition in the agentic graph.
type TraceStep struct {
	StepNumber int        `json:"step_number"`
	State      GraphState `json:"state"`
	Thought    string     `json:"thought,omitempty"`
	Action     string     `json:"action,omitempty"`
	ActionInput string    `json:"action_input,omitempty"`
	DocCount   int        `json:"doc_count"`
	DurationMs int64      `json:"duration_ms"`
	Timestamp  time.Time  `json:"timestamp"`
}

// ExecutionGraphTracer collects telemetry for state graph execution.
type ExecutionGraphTracer struct {
	Traces []TraceStep `json:"traces"`
}

func NewExecutionGraphTracer() *ExecutionGraphTracer {
	return &ExecutionGraphTracer{
		Traces: make([]TraceStep, 0),
	}
}

func (t *ExecutionGraphTracer) LogStep(state GraphState, thought, action, input string, docCount int, durationMs int64) {
	step := TraceStep{
		StepNumber:  len(t.Traces) + 1,
		State:       state,
		Thought:     thought,
		Action:      action,
		ActionInput: input,
		DocCount:    docCount,
		DurationMs:  durationMs,
		Timestamp:   time.Now().UTC(),
	}
	t.Traces = append(t.Traces, step)
	log.Printf("[GraphTracer] Step %d [%s] Action: %s(%q) Docs: %d (%dms)",
		step.StepNumber, step.State, step.Action, step.ActionInput, step.DocCount, step.DurationMs)
}

// ReformulateQuery rewrites low-quality queries to improve web/vector retrieval.
func ReformulateQuery(ctx context.Context, planner *QueryPlanner, query string, attemptedQueries []string) string {
	if planner == nil {
		return fmt.Sprintf("%s overview detailed documentation", query)
	}

	decomposed, err := planner.Decompose(ctx, fmt.Sprintf("%s (focus on authoritative reference docs and technical details)", query))
	if err == nil && len(decomposed) > 0 {
		for _, dq := range decomposed {
			alreadyAttempted := false
			for _, aq := range attemptedQueries {
				if dq == aq {
					alreadyAttempted = true
					break
				}
			}
			if !alreadyAttempted {
				return dq
			}
		}
	}
	return fmt.Sprintf("%s deep dive technical reference", query)
}
