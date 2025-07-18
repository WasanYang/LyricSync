'use server';

import { enhanceLyricLayout, type EnhanceLyricLayoutInput } from '@/ai/flows/enhance-lyric-layout';

export async function enhanceLyricsAction(input: EnhanceLyricLayoutInput) {
  try {
    const output = await enhanceLyricLayout(input);
    return { data: output };
  } catch (error) {
    console.error('Error enhancing lyrics:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { error: errorMessage };
  }
}
