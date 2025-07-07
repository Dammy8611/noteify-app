'use server';

/**
 * @fileOverview An AI agent for researching topics and creating new notes.
 *
 * - researchAndCreateNote - A function that generates a new note based on a topic, using existing notes as context.
 * - ResearchAndCreateNoteInput - The input type for the researchAndCreateNote function.
 * - ResearchAndCreateNoteOutput - The return type for the researchAndCreateNote function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const NoteSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
});

const ResearchAndCreateNoteInputSchema = z.object({
  topic: z.string().describe("The user's research query or topic."),
  existingNotes: z.array(NoteSchema).describe('A list of the user\'s existing notes to use for context.'),
});
export type ResearchAndCreateNoteInput = z.infer<typeof ResearchAndCreateNoteInputSchema>;

const ResearchAndCreateNoteOutputSchema = z.object({
  title: z.string().describe('The auto-generated, concise title for the new note.'),
  content: z.string().describe('The comprehensive, well-structured content for the new note.'),
});
export type ResearchAndCreateNoteOutput = z.infer<typeof ResearchAndCreateNoteOutputSchema>;

export async function researchAndCreateNote(input: ResearchAndCreateNoteInput): Promise<ResearchAndCreateNoteOutput> {
  return researchAndCreateNoteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'researchAndCreateNotePrompt',
  input: {schema: ResearchAndCreateNoteInputSchema},
  output: {schema: ResearchAndCreateNoteOutputSchema},
  prompt: `You are an expert research assistant. Your task is to generate a new, comprehensive note based on a user's specified topic.

You must:
1.  Analyze the user's research topic.
2.  Review the user's existing notes for any relevant context or related information.
3.  Combine information from the existing notes with your own broad knowledge base to create a detailed and well-structured note on the topic.
4.  The note content should be informative, well-organized, and ready for the user to save. Use markdown for formatting (e.g., **bold**, _italics_, - lists).
5.  Generate a concise, descriptive, and relevant title for this new note.

User's research topic: "{{{topic}}}"

User's existing notes for context (in JSON format):
{{{json existingNotes}}}

IMPORTANT: Your response MUST be ONLY the generated JSON object with the 'title' and 'content' fields. Do not include any conversational text, introductions, or apologies.
  `,
});

const researchAndCreateNoteFlow = ai.defineFlow(
  {
    name: 'researchAndCreateNoteFlow',
    inputSchema: ResearchAndCreateNoteInputSchema,
    outputSchema: ResearchAndCreateNoteOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
