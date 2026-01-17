const CURRENCY_PATTERN =
    /(\$|€|£|¥|₴|₽|zł|kr|chf)?\s*\d+([.,]\d+)?\s*(euro|euros|eur|dollar|dollars|usd|pound|pounds|gbp|uah|hryvnia|грн|гривень|гривня|долар|долари|доларів|євро|рублів|рубль|руб|zloty|zł|kroner|kr|franc|francs|chf|cents?|копійок|копійки|копійка)?/giu;

export const stripAmountsFromText = (text: string): string =>
    text
        .replace(CURRENCY_PATTERN, '')
        .replace(/\s{2,}/gu, ' ')
        .trim();
