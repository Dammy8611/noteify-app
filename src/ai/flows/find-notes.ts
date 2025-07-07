'use server';

/**
 * @fileOverview An AI agent for finding relevant notes based on a user's description.
 *
 * - findNotes - A function that handles finding notes.
 * - FindNotesInput - The input type for the findNotes function.
 * - FindNotesOutput - The return type for the findNotes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const NoteSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
});

const FindNotesInputSchema = z.object({
  description: z.string().describe("The user's search query or description of what they are looking for."),
  notes: z.array(NoteSchema).describe('The list of notes to search through.'),
});
export type FindNotesInput = z.infer<typeof FindNotesInputSchema>;

const FindNotesOutputSchema = z.object({
  noteIds: z
    .array(z.string())
    .describe("An array of note IDs that match the user's description."),
});
export type FindNotesOutput = z.infer<typeof FindNotesOutputSchema>;

export async function findNotes(input: FindNotesInput): Promise<FindNotesOutput> {
  return findNotesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findNotesPrompt',
  input: {schema: FindNotesInputSchema},
  output: {schema: FindNotesOutputSchema},
  prompt: `You are a powerful semantic search engine for a user's notes. Your task is to analyze the user's search description and the provided list of notes. Identify and return the IDs of all notes that are relevant to the user's query.

User's search description: "{{{description}}}"

Here are the notes available (in JSON format):
{{{json notes}}}

Analyze the description and the notes' titles and content. Return a JSON object containing a 'noteIds' array with the IDs of the notes that are most relevant to the search description. If no notes are relevant, return an empty array.
  `,
});

const findNotesFlow = ai.defineFlow(
  {
    name: 'findNotesFlow',
    inputSchema: FindNotesInputSchema,
    outputSchema: FindNotesOutputSchema,
  },
  async input => {
    if (input.notes.length === 0) {
      return { noteIds: [] };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
