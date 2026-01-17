export const stripAmountsFromText = (text: string): string =>
    text
        .replace(/\d+([.,]\d+)?\s*(euro|eur|€|\$|usd|uah|грн|гривень|долар|євро)?/giu, '')
        .replace(/\s{2,}/gu, ' ')
        .trim();
