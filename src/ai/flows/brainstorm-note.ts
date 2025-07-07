'use server';
/**
 * @fileOverview An AI agent for brainstorming and expanding on note content.
 *
 * - brainstormNote - A function that rewrites and elaborates on a user's note.
 * - BrainstormNoteInput - The input type for the brainstormNote function.
 * - BrainstormNoteOutput - The return type for the brainstormNote function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BrainstormNoteInputSchema = z.object({
  title: z.string().describe('The title of the note.'),
  noteContent: z.string().describe('The current content of the note.'),
});
export type BrainstormNoteInput = z.infer<typeof BrainstormNoteInputSchema>;

const BrainstormNoteOutputSchema = z.object({
  rewrittenContent: z
    .string()
    .describe('The rewritten and expanded content for the note.'),
});
export type BrainstormNoteOutput = z.infer<typeof BrainstormNoteOutputSchema>;

export async function brainstormNote(input: BrainstormNoteInput): Promise<BrainstormNoteOutput> {
  return brainstormNoteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'brainstormNotePrompt',
  input: {schema: BrainstormNoteInputSchema},
  output: {schema: BrainstormNoteOutputSchema},
  prompt: `You are an expert research assistant and writer. Your goal is to take a user's raw notes and transform them into a more detailed, well-structured, and insightful piece of content.

Analyze the user's note title and content.
- If it's a simple idea, expand on it with more detail, potential applications, and related concepts.
- If it's a list, add more context and explanation for each item.
- If it's a draft, refine the language, improve the structure, and fix any grammatical errors.
- Add relevant details and research to make the note more comprehensive.
- Maintain the original intent of the note but elevate it to be more concise and well-researched.

Return ONLY the rewritten content in the 'rewrittenContent' field of the JSON output.

User's Note Title: {{{title}}}
User's Note Content:
{{{noteContent}}}
  `,
});

const brainstormNoteFlow = ai.defineFlow(
  {
    name: 'brainstormNoteFlow',
    inputSchema: BrainstormNoteInputSchema,
    outputSchema: BrainstormNoteOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
