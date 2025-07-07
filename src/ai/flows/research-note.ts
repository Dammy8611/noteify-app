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
  contextNotes: z.array(NoteSchema).describe("A list of the user's existing notes selected to use for context."),
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
2.  Review the user's selected notes for any relevant context or related information.
3.  Combine information from the context notes with your own broad knowledge base to create a detailed and well-structured note on the topic.
4.  The note content must be informative and well-organized. **Crucially, use markdown for all formatting**. This includes using double asterisks for bold text (**example**), underscores for italic text (_example_), hash symbols for headings (# Heading 1, ## Heading 2), and a hyphen for list items (- example) to ensure the content is structured and readable.
5.  Generate a concise, descriptive, and relevant title for this new note.

User's research topic: "{{{topic}}}"

User's selected notes for context (in JSON format):
{{{json contextNotes}}}

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
