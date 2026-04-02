# Conversation Synthesis Skill

## Purpose
At the end of a working session, synthesize the conversation into a structured summary of key breakthroughs, new ideas, decisions made, and open action items. Optionally save relevant insights to Claude's memory.

---

## Trigger Phrases
Invoke this skill when the user says any of the following:
- "Synthesize this"
- "Synthesize this conversation"
- "End of session summary"
- "Session recap"
- "What did we decide?"
- "Capture this"
- "Log this session"
- "What are our action items?"
- "Summarize our discussion"
- "Save this to memory"

---

## Output Format

Produce a structured synthesis using the following sections. Only include sections that are relevant — omit empty ones.

### 🔍 Key Breakthroughs
Moments where a new insight clicked, a reframe occurred, or a problem was solved in a new way.

### 💡 New Ideas
Concepts, directions, or possibilities that emerged — not yet decided, but worth pursuing.

### ✅ Decisions Made
Concrete choices that were agreed upon.

### 📋 Open Action Items
Things that still need to happen. Include who owns them if clear.

### 🧠 Memory Candidates
Anything worth saving to Claude's long-term memory — projects, preferences, methodology, context.

---

## Behavior Instructions

1. Scan the full conversation for decisions, pivots, breakthroughs, and unresolved threads.
2. Be concise — use bullets, not paragraphs.
3. Flag memory candidates and ask the user before saving.
4. If nothing was decided, say so clearly.
5. If multiple projects were discussed, organize by project.

---

