# 🧠 Thinking Agents Catalog

## 📋 Overview

Complete catalogus van alle thinking agents die de Overseer kan inzetten. Elke agent heeft een specifieke denkstijl en kan in twee modes opereren: Creative (experimenteel) of Realistic (praktisch).

## 🎯 Agent Selection Matrix

### When to Use Which Agent

| Problem Type             | Primary Agents                        | Secondary Agents     |
| ------------------------ | ------------------------------------- | -------------------- |
| **New Feature Design**   | Lateral Thinking, First Principles    | Abstract, Analogical |
| **Bug Analysis**         | Systems Thinking, Decomposition       | Pattern Recognition  |
| **Architecture Design**  | Systems Thinking, Abstract            | First Principles     |
| **Performance Issues**   | Decomposition, Pattern Recognition    | Systems Thinking     |
| **User Experience**      | Analogical, Iterative                 | Lateral Thinking     |
| **Refactoring**          | Pattern Recognition, Abstract         | Decomposition        |
| **Security Analysis**    | First Principles, Systems Thinking    | Decomposition        |
| **Scalability Planning** | Systems Thinking, Pattern Recognition | Abstract             |

## 🤖 Individual Agent Profiles

### 1. First Principles Agent

**Denkstijl**: Alles terugbrengen tot fundamentele waarheden en van daaruit opbouwen

#### Creative Mode

```javascript
{
  approach: "What if we ignore all current constraints?",
  questions: [
    "What if gravity worked backwards?",
    "What if users had infinite patience?",
    "What if computing power was free?"
  ],
  output_style: "Revolutionary ideas, paradigm shifts",
  example: "Instead of optimizing the database, what if we eliminate the need for persistence entirely?"
}
```

#### Realistic Mode

```javascript
{
  approach: "What are the actual physical/logical constraints?",
  questions: [
    "What are the laws of physics here?",
    "What are the mathematical limits?",
    "What are the human factors?"
  ],
  output_style: "Practical foundations, hard truths",
  example: "Network latency is bounded by speed of light, so we need local caching"
}
```

**Sterke Punten**: Doorbreekt assumptions, vindt root causes
**Zwakke Punten**: Kan te abstract worden, soms te ver van praktijk

---

### 2. Lateral Thinking Agent

**Denkstijl**: Creatieve, onconventionele oplossingen via onverwachte connecties

#### Creative Mode

```javascript
{
  approach: "How can we solve this in the most unexpected way?",
  techniques: [
    "Random word association",
    "Reversal (do the opposite)",
    "Exaggeration",
    "Wishful thinking"
  ],
  output_style: "Wild ideas, unexpected connections",
  example: "Make the bug a feature - users love unpredictability!"
}
```

#### Realistic Mode

```javascript
{
  approach: "What unconventional but feasible solutions exist?",
  techniques: [
    "Cross-industry solutions",
    "Repurposing existing tools",
    "Combining unrelated features",
    "Minimal viable hacks"
  ],
  output_style: "Creative but implementable solutions",
  example: "Use the game engine's physics for UI animations"
}
```

**Sterke Punten**: Innovatieve oplossingen, doorbreekt fixed mindset
**Zwakke Punten**: Ideeën kunnen onpraktisch zijn, require veel filtering

---

### 3. Systems Thinking Agent

**Denkstijl**: Analyseren hoe componenten samenwerken in het grotere geheel

#### Creative Mode

```javascript
{
  approach: "What if we redesign the entire system?",
  focus_areas: [
    "Emergent behaviors",
    "Butterfly effects",
    "System harmonics",
    "Cascading benefits"
  ],
  output_style: "Holistic redesigns, systemic innovations",
  example: "Redesign the entire data flow to be event-driven"
}
```

#### Realistic Mode

```javascript
{
  approach: "How do changes ripple through the system?",
  focus_areas: [
    "Dependencies",
    "Bottlenecks",
    "Feedback loops",
    "Integration points"
  ],
  output_style: "Impact analysis, risk assessment",
  example: "Changing this API affects 17 services downstream"
}
```

**Sterke Punten**: Ziet grote plaatje, voorkomt onverwachte side effects
**Zwakke Punten**: Kan overweldigend zijn, analysis paralysis

---

### 4. Analogical Thinking Agent

**Denkstijl**: Concepten uit andere domeinen toepassen op huidige probleem

#### Creative Mode

```javascript
{
  approach: "What if this was a completely different domain?",
  analogies: [
    "Nature (biomimicry)",
    "Other industries",
    "Historical solutions",
    "Fiction/Fantasy"
  ],
  output_style: "Cross-domain innovations",
  example: "Handle user requests like ant colonies handle food gathering"
}
```

#### Realistic Mode

```javascript
{
  approach: "What proven patterns from other fields apply?",
  analogies: [
    "Established industries",
    "Similar problems",
    "Academic research",
    "Best practices"
  ],
  output_style: "Proven pattern adaptation",
  example: "Use supply chain logistics patterns for data pipeline"
}
```

**Sterke Punten**: Leert van andere domeinen, vermijdt reinventing wheel
**Zwakke Punten**: Analogieën kunnen misleidend zijn

---

### 5. Decomposition Agent

**Denkstijl**: Grote problemen opdelen in kleinere, behapbare stukken

#### Creative Mode

```javascript
{
  approach: "What are unconventional ways to slice this problem?",
  methods: [
    "Time-based decomposition",
    "Emotional decomposition",
    "Stakeholder decomposition",
    "Value decomposition"
  ],
  output_style: "Novel problem breakdowns",
  example: "Split features by user emotion rather than functionality"
}
```

#### Realistic Mode

```javascript
{
  approach: "What are the logical components?",
  methods: [
    "Functional decomposition",
    "Data flow decomposition",
    "Layer separation",
    "Module boundaries"
  ],
  output_style: "Clear component hierarchy",
  example: "Split into: UI layer, Business logic, Data access"
}
```

**Sterke Punten**: Maakt complexiteit behapbaar, enables parallel werk
**Zwakke Punten**: Kan over-engineered worden, verliest soms coherentie

---

### 6. Pattern Recognition Agent

**Denkstijl**: Herkennen van terugkerende structures en problemen

#### Creative Mode

```javascript
{
  approach: "What hidden patterns can we discover?",
  pattern_types: [
    "Behavioral patterns",
    "Temporal patterns",
    "Emotional patterns",
    "Chaos patterns"
  ],
  output_style: "Novel pattern discoveries",
  example: "User errors follow lunar cycles"
}
```

#### Realistic Mode

```javascript
{
  approach: "What established patterns apply?",
  pattern_types: [
    "Design patterns",
    "Anti-patterns",
    "Performance patterns",
    "Security patterns"
  ],
  output_style: "Standard pattern application",
  example: "This is a classic Observer pattern scenario"
}
```

**Sterke Punten**: Leert van geschiedenis, vermijdt bekende valkuilen
**Zwakke Punten**: Kan patterns forceren waar ze niet passen

---

### 7. Abstract Thinking Agent

**Denkstijl**: Van specifieke implementaties naar algemene concepten

#### Creative Mode

```javascript
{
  approach: "How abstract can we make this?",
  abstraction_levels: [
    "Meta-meta level",
    "Philosophical level",
    "Universal principles",
    "Pure concepts"
  ],
  output_style: "Highly generalized solutions",
  example: "Don't build a chat app, build a 'thought synchronization engine'"
}
```

#### Realistic Mode

```javascript
{
  approach: "What's the right level of abstraction?",
  abstraction_levels: [
    "Interface level",
    "Service level",
    "Component level",
    "Function level"
  ],
  output_style: "Practical abstractions",
  example: "Abstract the payment provider behind a common interface"
}
```

**Sterke Punten**: Enables hergebruik, toekomstbestendig
**Zwakke Punten**: Over-abstraction, astronaut architecture

---

### 8. Iterative Thinking Agent

**Denkstijl**: Stap voor stap verbeteren via feedback loops

#### Creative Mode

```javascript
{
  approach: "What wild experiments can we run?",
  iteration_styles: [
    "A/B/C/D/E testing",
    "Rapid prototyping",
    "Fail fast philosophy",
    "Evolutionary algorithms"
  ],
  output_style: "Experimental approach",
  example: "Release 10 versions daily and see what sticks"
}
```

#### Realistic Mode

```javascript
{
  approach: "What's the MVP and growth path?",
  iteration_styles: [
    "Agile sprints",
    "Incremental improvements",
    "Measured rollouts",
    "Data-driven decisions"
  ],
  output_style: "Structured iteration plan",
  example: "Week 1: Walking, Week 2: Running, Week 3: Jumping"
}
```

**Sterke Punten**: Reduces risk, learns from reality
**Zwakke Punten**: Kan traag zijn, misses big picture soms

## 🎭 Agent Interaction Patterns

### Complementary Pairs

- **First Principles + Systems Thinking**: Fundamentals within system context
- **Lateral + Pattern Recognition**: Creative solutions using proven patterns
- **Decomposition + Abstract**: Break down then generalize
- **Analogical + Iterative**: Apply patterns then refine

### Conflicting Perspectives (Valuable for Contrast)

- **First Principles vs Pattern Recognition**: Clean slate vs proven solutions
- **Systems vs Decomposition**: Holistic vs reductionist
- **Abstract vs Iterative**: Big design upfront vs emergent design
- **Lateral vs Realistic Mode**: Wild ideas vs practical constraints

## 📊 Agent Performance Metrics

### Effectiveness Scoring

```javascript
{
  innovation_score: 0-10,        // How novel are the ideas?
  practicality_score: 0-10,      // How implementable?
  insight_depth: 0-10,           // How deep is the analysis?
  coverage_breadth: 0-10,        // How many angles covered?
  coherence_score: 0-10,         // How well do ideas connect?
}
```

### Agent Selection Algorithm

```javascript
function selectAgentsForProblem(problemType, constraints, userPreferences) {
  const baseAgents = getBaseAgentsForType(problemType);

  // Adjust for constraints
  if (constraints.timeLimit < 1_week) {
    prioritizeAgent('Iterative', 'realistic');
    deprioritizeAgent('First Principles', 'creative');
  }

  if (constraints.riskTolerance === 'low') {
    agents.forEach(a => a.mode = 'realistic');
  }

  // User preferences
  if (userPreferences.loveInnovation) {
    prioritizeAgent('Lateral', 'creative');
    prioritizeAgent('Analogical', 'creative');
  }

  return finalAgentSelection;
}
```

## 🚀 Future Agent Ideas

### Potential New Agents

1. **Emotional Intelligence Agent**: Analyzes user/stakeholder feelings
2. **Economic Thinking Agent**: Cost-benefit analysis, ROI
3. **Ethical Reasoning Agent**: Moral implications, fairness
4. **Cultural Context Agent**: Different cultural perspectives
5. **Future Prediction Agent**: Long-term consequences
6. **Constraint Satisfaction Agent**: Works within tight limits
7. **Game Theory Agent**: Strategic interactions
8. **Chaos Theory Agent**: Non-linear effects, edge cases

---

**Next Step**: Implement base 3 agents (First Principles, Systems, Lateral) as MVP
