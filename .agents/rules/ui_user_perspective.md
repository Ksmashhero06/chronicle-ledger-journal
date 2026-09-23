# UI Design Rule: User's Perspective

> **"Treat the user experience as the primary design constraint; technology exists to support the user's task, not the other way around."**

## 17. DESIGN FROM THE USER'S PERSPECTIVE — MANDATORY

Do not design the interface from the developer's perspective.

Design every screen by first asking:

"What is the user trying to accomplish here?"

"What information does the user need at this moment?"

"What should the user do next?"

"What could confuse the user?"

"What happens if the user makes a mistake?"

"What happens if there is no data yet?"

"What happens when verification fails?"

"What happens when evidence is insufficient?"

"What happens when the user returns later?"

The user should never need to understand:
- Bedrock
- Lambda
- AST
- API Gateway
- DynamoDB
- SHA-256
- model inference
- internal architecture

unless they deliberately open a technical/details view.

The interface should expose the RESULT and the NEXT ACTION first.

Example:

Do NOT make the user interpret:

"Bedrock extraction confidence: 91.8%
AST evaluation: PROVEN_TRUE
SHA-256: ..."

Instead show:

"License requirement verified"

"Your repository declares an MIT license."

"Evidence: README.md"

[View evidence]

Then allow the user to expand:

"How was this checked?"

and show:
- extracted value
- rule
- source
- confidence
- hash
- evaluation details

Progressive disclosure is important.

### IMPORTANT USER STATES

Design explicitly for:

1. First-time user
   - Explain what the product does in plain language.
   - Give them one obvious starting action.
   - Avoid empty screens with unexplained technical terminology.

2. User with no requirements
   - Clearly explain what to add.
   - Provide an example.
   - Give one primary action.

3. User with requirements but no evidence
   - Show what is missing.
   - Tell the user exactly what kind of evidence is expected.
   - Provide an obvious "Add evidence" action.

4. User with evidence but incomplete verification
   - Explain what is blocking verification.
   - Do not merely show an error state.

5. Verified requirement
   - Show the result clearly.
   - Make the supporting evidence easy to inspect.

6. Failed requirement
   - Explain what failed and why.
   - Clearly distinguish "failed" from "not enough evidence".

7. Insufficient evidence
   - Never make the user guess what is missing.
   - Tell them what additional evidence would help.

8. Changed evidence
   - Explain that the previous verification is now stale.
   - Provide a clear re-verification action.

9. Large project
   - Help the user find what actually needs attention.
   - Surface missing/high-priority requirements.
   - Don't force the user to inspect every requirement manually.

10. Returning user
   - Preserve context.
   - Make it obvious what changed since their last visit.

### USER-CENTRIC INFORMATION HIERARCHY

On every verification screen, prioritize information in this order:

1. What is the requirement?
2. What is the current result?
3. Why did it get that result?
4. What evidence supports it?
5. What should the user do next?
6. Technical details, only when requested.

Do not reverse this order.

A user should understand the current state in a few seconds without opening a modal.

### USER ACTIONS

Every important state should have an obvious next action.

Examples:

MISSING
→ [Add Evidence]

NEEDS REVIEW
→ [Review Evidence]

STALE
→ [Re-run Verification]

PROVEN_FALSE
→ [View Failure]

PROVEN_TRUE
→ [View Evidence]

No Requirements
→ [Add Requirement]

No Evidence
→ [Add Evidence]

Do not make users search the interface for the next step.

### ERROR DESIGN

Errors must be written from the user's perspective.

Instead of:
"BedrockInvocationException: ValidationException"

show:
"Verification could not be completed."

Then:
"The AI could not extract the required value from this file."

[Try another file] [View details]

The technical error can remain available behind "View details".

### EMPTY STATES

Never use generic empty states such as:

"No entries found."

Instead explain:
- why the area is empty
- what the user can do
- what will happen after they do it

Example:

"No requirements added yet.

Add your project requirements and Chronicle Ledger will turn them into checks you can verify."

[Add requirements]

### USER CONFIDENCE

The user should always know:

- where they are
- what project they are working on
- what has been verified
- what still needs attention
- what action they can take next
- whether their data is saved

Do not make the user infer state from colors or small icons.

Avoid forcing users to understand internal system terminology.

### TECHNICAL DETAILS SHOULD BE OPTIONAL

Chronicle Ledger can expose technical evidence such as:
- rule expressions
- extracted variables
- confidence
- character spans
- SHA-256
- timestamps
- evaluation traces

But these should be progressively disclosed.

Default:
human-readable result.

Expanded:
technical reasoning.

Advanced/details:
raw evidence, rule AST, hashes, telemetry.

This lets both a normal user and a technical user use the same application.

### REAL USER JOURNEY

Design the main workflow around:

Create project
→ Add requirements
→ Review extracted requirements
→ Add evidence
→ Verify
→ Fix missing items
→ Re-verify
→ Reach readiness
→ Export/share result

Do not design around the underlying system architecture.

The user should feel:

"I know what I need to do."

not:

"I need to figure out how this AI system works."

### BEFORE IMPLEMENTING ANY UI CHANGE

For each major screen, state:

USER GOAL
What does the user want here?

USER CONTEXT
What do they already know?

PRIMARY INFORMATION
What must they understand immediately?

PRIMARY ACTION
What should they do next?

SECONDARY ACTIONS
What else might they need?

FAILURE / EMPTY STATE
What happens when there is no result?

SUCCESS STATE
What does completion look like?

Only then implement the screen.

### FINAL UI PRINCIPLE

The best UI is not the one that exposes the most technology.

It is the one that makes the user's task feel obvious.

Build Chronicle Ledger so that a first-time user can open it, understand what it does, complete one verification, inspect why the result was produced, and know what to do next without needing a tutorial.
