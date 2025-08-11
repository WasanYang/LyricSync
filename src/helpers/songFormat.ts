import { LyricLine } from '@/lib/songs';

const parseLyrics = (line: string) => {
  return line
    .replace(/\[[^\]]+\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

export const getLyricPreview = (lyrics: LyricLine[], isExpanded: boolean) => {
  let content = '';
  let lineCount = 0;
  const maxLines = isExpanded ? lyrics.length : 4;

  for (const line of lyrics) {
    if (line.text.startsWith('(')) {
      const italicText = `${line.text.replace(/^\((.*)\)$/, '[ $1 ]')}`;
      content += `${italicText}\n`;
      continue;
    }
    const textOnly = parseLyrics(line.text);
    if (textOnly) {
      content += textOnly + '\n';
      lineCount++;
      if (lineCount >= maxLines) {
        if (!isExpanded) content += '...';
        break;
      }
    }
  }
  return content.trim();
};
