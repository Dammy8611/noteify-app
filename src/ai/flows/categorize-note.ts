// src/ai/flows/categorize-note.ts
'use server';

/**
 * @fileOverview A note categorization AI agent.
 *
 * - categorizeNote - A function that handles the note categorization process.
 * - CategorizeNoteInput - The input type for the categorizeNote function.
 * - CategorizeNoteOutput - The return type for the categorizeNote function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategorizeNoteInputSchema = z.object({
  noteContent: z.string().describe('The content of the note to categorize.'),
});
export type CategorizeNoteInput = z.infer<typeof CategorizeNoteInputSchema>;

const CategorizeNoteOutputSchema = z.object({
  categories: z
    .array(z.string())
    .describe('An array of suggested categories for the note.'),
  reasoning: z
    .string()
    .describe('The AI reasoning behind the suggested categories.'),
});
export type CategorizeNoteOutput = z.infer<typeof CategorizeNoteOutputSchema>;

export async function categorizeNote(input: CategorizeNoteInput): Promise<CategorizeNoteOutput> {
  return categorizeNoteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'categorizeNotePrompt',
  input: {schema: CategorizeNoteInputSchema},
  output: {schema: CategorizeNoteOutputSchema},
  prompt: `You are a helpful AI assistant that categorizes notes based on their content.

  Given the following note content, suggest a few relevant categories that would help the user organize their notes.

  Note Content: {{{noteContent}}}

  Format your response as a JSON object with a 'categories' array and a 'reasoning' field explaining why you chose these categories.
  `, // Changed the template literal to use backticks.
});

const categorizeNoteFlow = ai.defineFlow(
  {
    name: 'categorizeNoteFlow',
    inputSchema: CategorizeNoteInputSchema,
    outputSchema: CategorizeNoteOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
