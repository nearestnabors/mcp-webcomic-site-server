# Audio: From Simple TTS to Radio Plays

This chapter covers audio features in the MCP App, from the currently implemented text-to-speech to the stretch goal of multi-voice "radio play" performances.

---

## What's Implemented: Simple Text-to-Speech

The MCP App includes a **"🔊 Listen" button** that reads the comic transcript aloud using the browser's built-in Web Speech API. This is an accessibility feature — users can hear the comic instead of reading it.

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│  MCP App (inside Claude's iframe)                                │
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐ │
│  │ 🔊 Listen    │────▶│ transcript   │────▶│ speechSynthesis  │ │
│  │   button     │     │    text      │     │    .speak()      │ │
│  └──────────────┘     └──────────────┘     └──────────────────┘ │
│                                                   │              │
│                                                   ▼              │
│                                            🔊 Browser audio      │
└─────────────────────────────────────────────────────────────────┘
```

### The Code

From `mcp-app/app.js`:

```javascript
// Check if browser supports Web Speech API
function isTTSSupported() {
  return 'speechSynthesis' in window;
}

// Speak the transcript text
function speakTranscript() {
  if (!isTTSSupported()) {
    console.warn('Text-to-speech is not supported in this browser.');
    return;
  }

  // Get the transcript text from the text-only view
  const text = textOnlyTranscript.textContent;
  if (!text || text.trim() === '') {
    return;
  }

  // Cancel any ongoing speech
  stopSpeaking();

  // Create a new utterance
  const utterance = new SpeechSynthesisUtterance(text);

  // Set up event handlers
  utterance.onstart = function() {
    isSpeaking = true;
    ttsBtn.textContent = '⏹ Stop';
  };

  utterance.onend = function() {
    isSpeaking = false;
    ttsBtn.textContent = '🔊 Listen';
  };

  utterance.onerror = function(event) {
    console.error('TTS error:', event.error);
    isSpeaking = false;
    ttsBtn.textContent = '🔊 Listen';
  };

  // Start speaking
  window.speechSynthesis.speak(utterance);
}

// Stop any ongoing speech
function stopSpeaking() {
  if (isTTSSupported()) {
    window.speechSynthesis.cancel();
  }
  isSpeaking = false;
  if (ttsBtn) {
    ttsBtn.textContent = '🔊 Listen';
  }
}

// Toggle playback
function toggleTTS() {
  if (isSpeaking) {
    stopSpeaking();
  } else {
    speakTranscript();
  }
}
```

### Key Behaviors

| Action | Result |
|--------|--------|
| Click "🔊 Listen" | Starts reading the transcript |
| Click "⏹ Stop" | Stops speech immediately |
| Navigate to new page | Auto-stops any ongoing speech |
| No transcript available | Button is disabled |

### Limitations

This is intentionally simple:

- **Single voice** — Uses the browser's default voice
- **Linear reading** — Reads everything straight through, no pauses
- **No character distinction** — Narrator, dialogue, and stage directions all sound the same
- **Platform-dependent quality** — macOS voices are decent, some browsers are robotic

This is fine for accessibility ("read me this page") but not theatrical.

---

## MCP Prompt: `dramatic-reading`

For a more performative experience, the MCP server exposes a **prompt** called `dramatic-reading`. This is different from the TTS button — instead of the browser speaking, Claude performs the reading with distinct character voices.

> **Note:** As of early 2025, Claude Desktop doesn't yet surface MCP prompts in its `/` command picker. The prompt is implemented and ready for when support arrives. In the meantime, you can test prompts using the MCP Inspector or other MCP clients that support the `prompts/list` and `prompts/get` methods.

### Tools vs Prompts

| Feature | Tool | Prompt |
|---------|------|--------|
| Invocation | Agent decides when to call | User explicitly selects from UI |
| Example | `get_page`, `search_comics` | `dramatic-reading` |
| Returns | Data for agent to use | Messages injected into conversation |

### How It Works

When a user selects the `dramatic-reading` prompt, it injects instructions into the conversation:

```typescript
// The prompt returns messages that get added to the conversation
{
  messages: [{
    role: 'user',
    content: {
      type: 'text',
      text: `Perform this comic page as a dramatic reading.

      Use distinct voices for each character:
      - Gale Allen: Confident space commander, authoritative but warm
      - Girl Squadron Member: Eager young cadet, enthusiastic

      Transcript:
      [transcript text here]`
    }
  }]
}
```

Claude then performs the page, using different vocal styles for each character. No browser TTS involved — the AI does the "acting."

### Character Voice Data

Each character in `characters.json` has a `voice` field for this purpose:

```json
{
  "gale_allen": {
    "slug": "gale_allen",
    "name": "Gale Allen",
    "voice": "Confident space commander, authoritative but warm",
    "comicId": "fran-hopper-comics"
  },
  "girl_squadron_member": {
    "slug": "girl_squadron_member",
    "name": "Girl Squadron Member",
    "voice": "Eager young cadet, enthusiastic",
    "comicId": "fran-hopper-comics"
  }
}
```

---

## Stretch Goal: Radio Plays via WebMCP

A more ambitious approach would have the MCP App orchestrate browser TTS with different voices per character. This combines MCP and WebMCP.

### The Concept

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Claude    │     │  MCP App    │     │   Browser   │
│  "read the  │ ──▶ │  parses     │ ──▶ │  plays TTS  │
│   comic"    │     │  transcript │     │  per voice  │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │ characters  │
                    │   .json     │
                    │ (voice info)│
                    └─────────────┘
```

1. MCP App parses transcript into dialogue lines
2. For each line, identifies the speaker
3. Looks up voice description from `characters.json`
4. Calls a WebMCP `speak_dialogue` tool on the static site
5. Browser TTS speaks the line with a mapped voice
6. Repeat for each line

### Hypothetical Implementation

**MCP App (orchestrator):**

```javascript
async function playRadioMode(pageData) {
  const transcript = pageData.page.transcript;
  const lines = parseDialogue(transcript);

  for (const line of lines) {
    const character = characters[line.speaker.toLowerCase()];
    const voice = character?.voice || 'neutral narrator';

    // Use WebMCP to trigger TTS in the browser
    await app.callServerTool({
      name: 'speak_dialogue',
      arguments: {
        text: line.text,
        voice_description: voice,
        character_name: line.speaker
      }
    });

    // Wait for speech to complete
    await waitForSpeechEnd();
  }
}

function parseDialogue(transcript) {
  const lines = [];
  const regex = /^([A-Z]+):\s*(?:\([^)]+\)\s*)?(.+)$/gm;
  let match;

  while ((match = regex.exec(transcript)) !== null) {
    lines.push({
      speaker: match[1],
      text: match[2]
    });
  }

  return lines;
}
```

**WebMCP Tool (on static site):**

```javascript
if ('modelContext' in navigator) {
  navigator.modelContext.registerTool({
    name: 'speak_dialogue',
    description: 'Speak a line of dialogue using text-to-speech',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'The dialogue to speak' },
        voice_description: { type: 'string', description: 'Voice style hint' },
        character_name: { type: 'string', description: 'Character speaking' }
      },
      required: ['text']
    },
    execute: async ({ text, voice_description, character_name }) => {
      return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);

        // Map voice descriptions to available browser voices
        const voices = speechSynthesis.getVoices();
        utterance.voice = selectVoice(voices, voice_description);

        utterance.onend = () => resolve({ spoken: true, character: character_name });
        speechSynthesis.speak(utterance);
      });
    }
  });
}

function selectVoice(voices, description) {
  const desc = description.toLowerCase();

  if (desc.includes('girl') || desc.includes('female')) {
    return voices.find(v => v.name.includes('Female')) || voices[0];
  }
  if (desc.includes('boy') || desc.includes('male')) {
    return voices.find(v => v.name.includes('Male')) || voices[0];
  }

  return voices[0];
}
```

### Why This Pattern Matters

Even if the voice quality is limited, this demonstrates a powerful architecture:

1. **MCP Apps can orchestrate** — They're not just displays, they can coordinate complex flows
2. **WebMCP exposes browser capabilities** — TTS, media playback, sensors, etc.
3. **Composability** — MCP + WebMCP working together across boundaries

The same pattern could be used for:
- MCP App controlling video playback via WebMCP
- MCP App interacting with maps via WebMCP
- MCP App filling forms across multiple sites

### Limitations of the Stretch Goal

- **Voice selection is crude** — Browser TTS offers limited voice variety
- **Timing is tricky** — Coordinating speech completion across the iframe boundary
- **Browser support varies** — Not all browsers have good TTS
- **No real voice acting** — Just different TTS voices, not actual performances

For production, you'd want a proper TTS service with voice cloning or pre-recorded audio.

---

## Summary

| Feature | Status | How It Works |
|---------|--------|--------------|
| 🔊 Listen button | ✅ Implemented | Browser TTS reads transcript (single voice) |
| `dramatic-reading` prompt | ✅ Implemented | Claude performs with character voices |
| Radio Play mode | 🔮 Stretch goal | MCP App + WebMCP orchestrates multi-voice TTS |
