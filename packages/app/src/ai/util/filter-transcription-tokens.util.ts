const TECHNICAL_TOKEN_PATTERN = /\[(music|blank_audio|blank audio|silence|noise|applause|laughter|inaudible|BLANK_AUDIO)\]/giu;

export const filterTranscriptionTokens = (text: string): string =>
    text
        .replace(TECHNICAL_TOKEN_PATTERN, '')
        .replace(/\s{2,}/gu, ' ')
        .trim();
