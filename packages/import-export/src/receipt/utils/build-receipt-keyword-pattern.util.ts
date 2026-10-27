export const buildReceiptKeywordPattern = (keywords: readonly string[], flags: string): RegExp => {
    const alternation = [...keywords]
        .sort((left, right) => right.length - left.length)
        .map(keyword => keyword.replaceAll(/[.*+?^${}()|[\]\\]/gu, '\\$&'))
        .join('|');

    return new RegExp(String.raw`(?<!\p{L})(?:${alternation})(?!\p{L})`, flags);
};
