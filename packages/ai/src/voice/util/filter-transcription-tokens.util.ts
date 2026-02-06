const BRACKETED_TOKEN_PATTERN = /\[[^\]]*\]|\([^)]*\)/gu;

export const filterTranscriptionTokens = (text: string): string =>
    text
        .replace(BRACKETED_TOKEN_PATTERN, '')
        .replace(/\s{2,}/gu, ' ')
        .trim();
