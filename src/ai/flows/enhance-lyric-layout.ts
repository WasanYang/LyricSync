// src/ai/flows/enhance-lyric-layout.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for enhancing lyric layout by suggesting optimal line breaks.
 *
 * It exports:
 * - `enhanceLyricLayout`: An async function that takes raw lyrics as input and returns enhanced lyrics with suggested line breaks.
 * - `EnhanceLyricLayoutInput`: The input type for the `enhanceLyricLayout` function.
 * - `EnhanceLyricLayoutOutput`: The output type for the `enhanceLyricLayout` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceLyricLayoutInputSchema = z.object({
  rawLyrics: z
    .string()
    .describe('The raw lyrics to be enhanced with optimal line breaks.'),
});
export type EnhanceLyricLayoutInput = z.infer<typeof EnhanceLyricLayoutInputSchema>;

const EnhanceLyricLayoutOutputSchema = z.object({
  enhancedLyrics: z
    .string()
    .describe('The lyrics enhanced with optimal line breaks.'),
});
export type EnhanceLyricLayoutOutput = z.infer<typeof EnhanceLyricLayoutOutputSchema>;

export async function enhanceLyricLayout(input: EnhanceLyricLayoutInput): Promise<EnhanceLyricLayoutOutput> {
  return enhanceLyricLayoutFlow(input);
}

const enhanceLyricLayoutPrompt = ai.definePrompt({
  name: 'enhanceLyricLayoutPrompt',
  input: {schema: EnhanceLyricLayoutInputSchema},
  output: {schema: EnhanceLyricLayoutOutputSchema},
  prompt: `You are a professional lyric editor. Your task is to analyze the provided raw lyrics and suggest the most visually appealing and rhythmically appropriate line breaks.  Consider natural phrasing, musicality, and readability when making your suggestions.  Return the lyrics with line breaks inserted. Preserve the original lyric content.

Raw Lyrics:
{{{rawLyrics}}}`,
});

const enhanceLyricLayoutFlow = ai.defineFlow(
  {
    name: 'enhanceLyricLayoutFlow',
    inputSchema: EnhanceLyricLayoutInputSchema,
    outputSchema: EnhanceLyricLayoutOutputSchema,
  },
  async input => {
    const {output} = await enhanceLyricLayoutPrompt(input);
    return output!;
  }
);
