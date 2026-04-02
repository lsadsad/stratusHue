#!/usr/bin/env node
// ascii-sequence — Deterministic pixel-perfect ASCII sequence diagram renderer
// Usage: node ascii-sequence.js < input.json
// Or:    echo '{ ... }' | node ascii-sequence.js
//
// Input format (JSON on stdin):
// {
//   "participants": ["Browser", "CDN", "Origin Server", "Database"],
//   "messages": [
//     { "from": "Browser", "to": "CDN", "label": "GET /page" },
//     { "from": "CDN", "to": "CDN", "label": "cache HIT?", "type": "decision",
//       "branches": [
//         { "label": "yes", "messages": [
//           { "from": "CDN", "to": "Browser", "label": "200" }
//         ]},
//         { "label": "no", "messages": [
//           { "from": "CDN", "to": "Origin Server", "label": "fwd" },
//           { "from": "Origin Server", "to": "Database", "label": "SELECT" },
//           { "from": "Database", "to": "Origin Server", "label": "rows" }
//         ]}
//       ]
//     },
//     { "from": "Origin Server", "to": "Browser", "label": "200 (+cache)", "through": ["CDN"] }
//   ]
// }

'use strict';

const IDLE = '\u250A';   // ┊
const ACTIVE = '\u2502'; // │
const H = '\u2500';      // ─
const ARR_R = '\u25B6';  // ▶
const ARR_L = '\u25C0';  // ◀

// Double-line box chars
const DB_TL = '\u2554'; // ╔
const DB_TR = '\u2557'; // ╗
const DB_BL = '\u255A'; // ╚
const DB_BR = '\u255D'; // ╝
const DB_H  = '\u2550'; // ═
const DB_V  = '\u2551'; // ║
const DB_BT = '\u2567'; // ╧
const DB_TB = '\u2564'; // ╤

/**
 * Compute column centers from participant names.
 * Min gap between centers = max(longest_label_between_pair) + 6
 */
function computeColumns(participants, messages) {
  const minGap = 18;
  const centers = [];
  let pos = 6; // left margin for first participant
  for (let i = 0; i < participants.length; i++) {
    if (i === 0) {
      centers.push(pos);
    } else {
      // Find max label length for any arrow between adjacent columns i-1..i (or wider)
      let neededGap = Math.max(minGap, participants[i].length + 4, participants[i - 1].length + 4);

      // Check all messages for labels that span columns that include this gap
      const allMsgs = flattenMessages(messages);
      for (const m of allMsgs) {
        const fi = participants.indexOf(m.from);
        const ti = participants.indexOf(m.to);
        if (fi === -1 || ti === -1) continue;
        const lo = Math.min(fi, ti);
        const hi = Math.max(fi, ti);
        // If this message spans exactly one column gap that includes position i
        if (hi - lo === 1 && hi === i) {
          neededGap = Math.max(neededGap, m.label.length + 6);
        }
        // Multi-span messages: we'll handle via "through" — for now gap needs room
        if (hi - lo > 1 && lo < i && hi >= i) {
          // distribute label across spans — don't inflate single gap
        }
      }
      centers.push(centers[i - 1] + neededGap);
    }
  }
  return centers;
}

function flattenMessages(messages) {
  const result = [];
  for (const m of messages) {
    if (m.type === 'decision') {
      for (const branch of (m.branches || [])) {
        result.push(...flattenMessages(branch.messages || []));
      }
    } else {
      result.push(m);
    }
  }
  return result;
}

function makeLine(width, centers, activeSet, participants) {
  const chars = new Array(width).fill(' ');
  for (let i = 0; i < participants.length; i++) {
    const c = centers[i];
    if (c < width) {
      chars[c] = activeSet.has(participants[i]) ? ACTIVE : IDLE;
    }
  }
  return chars;
}

function centerText(text, col, width) {
  const half = Math.floor(text.length / 2);
  const start = col - half;
  return { start, text };
}

function writeText(chars, start, text) {
  for (let i = 0; i < text.length; i++) {
    const pos = start + i;
    if (pos >= 0 && pos < chars.length) {
      chars[pos] = text[i];
    }
  }
}

function renderHeader(participants, centers, width) {
  const chars = new Array(width).fill(' ');
  for (let i = 0; i < participants.length; i++) {
    const { start, text } = centerText(participants[i], centers[i], width);
    writeText(chars, start, text);
  }
  return chars.join('').trimEnd();
}

function renderLifeline(width, centers, activeSet, participants) {
  const chars = makeLine(width, centers, activeSet, participants);
  return chars.join('').trimEnd();
}

function renderArrow(width, centers, participants, activeSet, from, to, label) {
  const chars = makeLine(width, centers, activeSet, participants);
  const fi = participants.indexOf(from);
  const ti = participants.indexOf(to);
  if (fi === -1 || ti === -1) return chars.join('').trimEnd();

  const fc = centers[fi];
  const tc = centers[ti];
  const goingRight = tc > fc;

  let arrowStart, arrowEnd;
  if (goingRight) {
    arrowStart = fc + 1;
    arrowEnd = tc - 1;
  } else {
    arrowStart = tc + 1;
    arrowEnd = fc - 1;
  }

  // Fill with horizontal line
  for (let x = arrowStart; x <= arrowEnd; x++) {
    chars[x] = H;
  }

  // Place arrowhead
  if (goingRight) {
    chars[arrowEnd] = ARR_R;
  } else {
    chars[arrowStart] = ARR_L;
  }

  // Clear intermediate lifelines that the arrow passes through
  for (let i = 0; i < participants.length; i++) {
    const c = centers[i];
    if (c > Math.min(fc, tc) && c < Math.max(fc, tc)) {
      // Arrow passes through this lifeline — keep the arrow char
      chars[c] = H;
    }
  }

  // Place label centered on the arrow
  if (label) {
    const labelWithPad = ' ' + label + ' ';
    const mid = Math.floor((arrowStart + arrowEnd) / 2);
    const labelStart = mid - Math.floor(labelWithPad.length / 2);
    writeText(chars, labelStart, labelWithPad);
  }

  return chars.join('').trimEnd();
}

function renderDecisionBox(width, centers, participants, activeSet, participant, label) {
  const lines = [];
  const col = centers[participants.indexOf(participant)];
  const boxContent = ' ' + label + ' ';
  const innerWidth = boxContent.length;
  const boxLeft = col - Math.floor(innerWidth / 2) - 1;
  const boxRight = boxLeft + innerWidth + 1;

  // Top border with ╧ at the lifeline position
  const topChars = makeLine(width, centers, activeSet, participants);
  for (let x = boxLeft; x <= boxRight; x++) {
    if (x === boxLeft) topChars[x] = DB_TL;
    else if (x === boxRight) topChars[x] = DB_TR;
    else if (x === col) topChars[x] = DB_BT;
    else topChars[x] = DB_H;
  }
  lines.push(topChars.join('').trimEnd());

  // Content line
  const midChars = makeLine(width, centers, activeSet, participants);
  midChars[boxLeft] = DB_V;
  midChars[boxRight] = DB_V;
  writeText(midChars, boxLeft + 1, boxContent);
  // Restore lifelines outside box that were overwritten
  for (let i = 0; i < participants.length; i++) {
    const c = centers[i];
    if (c < boxLeft || c > boxRight) {
      midChars[c] = activeSet.has(participants[i]) ? ACTIVE : IDLE;
    }
  }
  lines.push(midChars.join('').trimEnd());

  // Bottom border with ╤ at lifeline and branch columns
  const botChars = makeLine(width, centers, activeSet, participants);
  for (let x = boxLeft; x <= boxRight; x++) {
    if (x === boxLeft) botChars[x] = DB_BL;
    else if (x === boxRight) botChars[x] = DB_BR;
    else if (x === col) botChars[x] = DB_TB;
    else botChars[x] = DB_H;
  }
  lines.push(botChars.join('').trimEnd());

  return { lines, boxLeft, boxRight, col };
}

function renderBranchLabels(width, centers, participants, activeSet, col, branches, boxLeft, boxRight) {
  const chars = makeLine(width, centers, activeSet, participants);
  // Place branch labels below the decision box, flanking the lifeline
  if (branches.length >= 1) {
    const yesLabel = branches[0].label || 'yes';
    writeText(chars, col - yesLabel.length - 1, yesLabel);
  }
  if (branches.length >= 2) {
    const noLabel = branches[1].label || 'no';
    writeText(chars, col + 2, noLabel);
  }
  // Restore lifeline
  chars[col] = ACTIVE;
  return chars.join('').trimEnd();
}

function render(input) {
  const { participants, messages } = input;
  const centers = computeColumns(participants, messages);
  // Ensure width accommodates the last participant's name
  const lastCenter = centers[centers.length - 1];
  const lastNameHalf = Math.ceil(participants[participants.length - 1].length / 2);
  const width = Math.max(lastCenter + lastNameHalf + 4, lastCenter + 10);
  const output = [];

  // Track which participants are "active" (have been contacted)
  const activeSet = new Set();
  // Start with first participant active
  activeSet.add(participants[0]);

  // Header
  output.push(renderHeader(participants, centers, width));

  // Initial lifeline
  output.push(renderLifeline(width, centers, activeSet, participants));

  function processMessages(msgs) {
    for (const msg of msgs) {
      if (msg.type === 'decision') {
        // Blank line before decision
        output.push(renderLifeline(width, centers, activeSet, participants));

        const { lines, boxLeft, boxRight, col } = renderDecisionBox(
          width, centers, participants, activeSet, msg.from, msg.label
        );
        output.push(...lines);

        // Branch labels
        output.push(renderBranchLabels(
          width, centers, participants, activeSet, col, msg.branches || [], boxLeft, boxRight
        ));

        // Process first branch (left / "yes")
        if (msg.branches && msg.branches[0]) {
          processMessages(msg.branches[0].messages || []);
        }

        // Process second branch (right / "no") 
        if (msg.branches && msg.branches[1]) {
          processMessages(msg.branches[1].messages || []);
        }
      } else {
        // Activate participants on contact
        activeSet.add(msg.from);
        activeSet.add(msg.to);

        output.push(renderArrow(width, centers, participants, activeSet, msg.from, msg.to, msg.label));
      }
    }
  }

  processMessages(messages);

  // Final lifeline
  output.push(renderLifeline(width, centers, activeSet, participants));

  return output.join('\n');
}

// Read from stdin
let data = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { data += chunk; });
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data);
    console.log(render(input));
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
});
