/**
 * MCP Prompt: dramatic-reading
 *
 * Performs a dramatic reading of a comic page using distinct character voices.
 * This prompt fetches the page transcript and character voice descriptions,
 * then instructs Claude to read the dialogue in character.
 */

import { z } from 'zod';
import { getPageHandler } from '../tools/get-page.js';
import { listCharactersHandler } from '../tools/list-characters.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DramaticReadingInput {
  comic_id: string;
  storyline_id: string;
  page_number: number;
}

// Note: Return type must be compatible with MCP SDK's GetPromptResult
// which expects messages with TextContent, ImageContent, AudioContent, or EmbeddedResource

// ─── Prompt Definition ────────────────────────────────────────────────────────

export const dramaticReadingPrompt = {
  name: 'dramatic-reading',
  description:
    'Perform a dramatic reading of a comic page with distinct character voices. The AI will read dialogue in character based on voice descriptions, narrate action and scene descriptions, and bring the page to life.',
  arguments: [
    {
      name: 'comic_id',
      description: 'The comic identifier (e.g., "rachel-the-great", "other-comics")',
      required: true,
    },
    {
      name: 'storyline_id',
      description: 'The storyline identifier (e.g., "return-of-the-anti-cupid", "crow-princess")',
      required: true,
    },
    {
      name: 'page_number',
      description: 'The page number to read (1-indexed)',
      required: true,
    },
  ],
};

// ─── Zod Schema for Validation ────────────────────────────────────────────────

export const dramaticReadingSchema = {
  comic_id: z.string().describe('The comic identifier (e.g., "rachel-the-great", "other-comics")'),
  storyline_id: z.string().describe('The storyline identifier'),
  page_number: z.number().describe('The page number to read (1-indexed)'),
};

// ─── Handler ──────────────────────────────────────────────────────────────────

/**
 * Handler for the dramatic-reading prompt.
 * Fetches page data and character voices, returns a prompt message
 * instructing the AI to perform a dramatic reading.
 */
export async function dramaticReadingHandler(input: DramaticReadingInput) {
  // Fetch the page data
  const pageResult = await getPageHandler({
    comic_id: input.comic_id,
    storyline_id: input.storyline_id,
    page_number: input.page_number,
  });

  // Fetch characters for this comic (for voice descriptions)
  const charactersResult = await listCharactersHandler({
    comic_id: input.comic_id,
  });

  // Filter to only characters with voice descriptions
  const voicedCharacters = charactersResult.characters.filter((c) => c.voice && c.voice.trim());

  // Build the character voices section
  let voicesSection = '';
  if (voicedCharacters.length > 0) {
    voicesSection = `
## Character Voices

Use these voice descriptions to inform how you read each character's dialogue:

${voicedCharacters.map((c) => `- **${c.name}**: ${c.voice}`).join('\n')}
`;
  }

  // Build the prompt message
  const promptText = `# Dramatic Reading Request

Please perform a dramatic reading of this comic page. Read the dialogue in character using distinct voices, narrate the action and scene descriptions, and bring the page to life!

## Page Information

- **Comic**: ${pageResult.navigation.comicTitle}
- **Storyline**: ${pageResult.navigation.storylineTitle}
- **Page**: ${input.page_number} of ${pageResult.navigation.totalPages}
- **Title**: ${pageResult.page.title}
${voicesSection}
## Transcript

${pageResult.page.transcript || '*No transcript available for this page.*'}

---

**Instructions for the reading:**
1. Use distinct voices for each character based on the voice descriptions above
2. Narrate panel descriptions and action in a storyteller voice
3. Add appropriate dramatic pauses and emphasis
4. If a character doesn't have a voice description, invent an appropriate voice based on context
5. Have fun with it!`;

  return {
    messages: [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: promptText,
        },
      },
    ],
  };
}
