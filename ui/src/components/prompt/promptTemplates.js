export const BUILTIN_PROMPT_TEMPLATES = [
  {
    id: 'tpl_research_paper_analyzer',
    name: 'Research Paper Analysis',
    category: 'Research',
    tags: ['papers', 'methodology', 'analysis'],
    description: 'Break down core contributions, research gaps, limitations, and next directions.',
    executionMode: 'standard',
    isBuiltin: true,
    instructions: `Act as an experienced research analyst. Analyze all selected sources and identify:
1. Core research contributions
2. Research gaps
3. Methodological limitations
4. Future research directions`
  },
  {
    id: 'tpl_literature_review',
    name: 'Literature Review',
    category: 'Research',
    tags: ['synthesis', 'themes', 'citations'],
    description: 'Synthesize themes, agreements, contradictions, and open questions across sources.',
    executionMode: 'standard',
    isBuiltin: true,
    instructions: `Synthesize the selected sources into a structured literature review:
- Major themes and consensus findings
- Key points of disagreement or conflicting evidence
- Methodological approaches compared across works
- Open questions for further investigation

Cite every claim with inline source references.`
  },
  {
    id: 'tpl_research_gap_identifier',
    name: 'Research Gap Identifier',
    category: 'Research',
    tags: ['gaps', 'hypotheses', 'evaluation'],
    description: 'Spot unaddressed edge cases, weak assumptions, and high-impact hypotheses.',
    executionMode: 'custom_priority',
    isBuiltin: true,
    instructions: `Critically examine the selected sources to uncover concrete research gaps:
1. Unverified assumptions or narrow datasets
2. Contradictions between empirical results and conclusions
3. Missing baselines, populations, or real-world constraints
4. 3 actionable follow-up research questions ranked by impact`
  },
  {
    id: 'tpl_academic_tutor',
    name: 'Academic Tutor',
    category: 'Study',
    tags: ['learning', 'intuition', 'examples'],
    description: 'Explain complex concepts step-by-step from intuition to formal detail.',
    executionMode: 'standard',
    isBuiltin: true,
    instructions: `Act as a patient academic tutor. Using only the selected sources:
- Start with a plain-English intuition of the core concepts
- Walk through the formal definitions or mechanics step by step
- Give one concrete example grounded in the sources
- End with 3 self-check questions (with brief answers hidden under a summary section)`
  },
  {
    id: 'tpl_exam_preparation',
    name: 'Exam Preparation',
    category: 'Study',
    tags: ['revision', 'questions', 'recall'],
    description: 'Create high-yield revision notes, key definitions, and practice questions.',
    executionMode: 'standard',
    isBuiltin: true,
    instructions: `Prepare a focused exam revision guide from the selected sources:
1. Key terms and exact definitions
2. Core formulas, frameworks, or causal mechanisms
3. Common misconceptions or exam traps
4. 5 practice questions (mix of short-answer and scenario-based) with concise model answers`
  },
  {
    id: 'tpl_technical_docs',
    name: 'Technical Documentation',
    category: 'Technical',
    tags: ['architecture', 'api', 'specs'],
    description: 'Extract architecture, interfaces, constraints, and implementation details.',
    executionMode: 'custom_priority',
    isBuiltin: true,
    instructions: `Produce clean technical documentation based strictly on the selected sources:
- System overview and component responsibilities
- Key interfaces, inputs/outputs, and data flows
- Configuration, edge cases, and failure modes
- Concrete usage examples or code snippets where present in the sources`
  },
  {
    id: 'tpl_comparative_analysis',
    name: 'Comparative Analysis',
    category: 'Research',
    tags: ['comparison', 'table', 'tradeoffs'],
    description: 'Compare approaches, evidence, and trade-offs in a structured matrix.',
    executionMode: 'standard',
    isBuiltin: true,
    instructions: `Compare the approaches, arguments, or systems across the selected sources:
1. Provide a Markdown comparison table (criteria, strengths, weaknesses, evidence quality)
2. Highlight decisive trade-offs
3. Recommend when each approach is most appropriate based strictly on source evidence`
  },
  {
    id: 'tpl_executive_summary',
    name: 'Executive Summary',
    category: 'Writing',
    tags: ['brief', 'decisions', 'takeaways'],
    description: 'Distill key findings, risks, and recommendations for decision-makers.',
    executionMode: 'standard',
    isBuiltin: true,
    instructions: `Write a crisp executive summary grounded in the selected sources:
- TL;DR (3 sentences maximum)
- Key findings with supporting evidence
- Primary risks, caveats, or unknowns
- Recommended next actions`
  },
  {
    id: 'tpl_critical_analyst',
    name: 'Critical Research Analyst',
    category: 'Research',
    tags: ['critique', 'bias', 'evidence'],
    description: 'Stress-test claims, sample sizes, methodology, and unsupported leaps.',
    executionMode: 'custom_priority',
    isBuiltin: true,
    instructions: `Adopt a skeptical peer-reviewer lens on the selected sources:
- Which claims are strongly supported by direct evidence vs. speculative?
- What methodological flaws, confounding variables, or selection biases appear?
- Which alternative explanations are overlooked?
Be specific and cite the exact source sections.`
  }
];

export const PROMPT_CATEGORIES = ['All', 'Research', 'Study', 'Technical', 'Writing', 'Saved'];
