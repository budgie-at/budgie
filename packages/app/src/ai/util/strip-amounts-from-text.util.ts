const NUMBER_WORDS =
    'one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand';

const CURRENCY_WORDS =
    'euros|euro|eur|dollars|dollar|usd|pounds|pound|gbp|uah|hryvnia|гривень|гривня|грн|долари|доларів|долар|євро|zloty|zł|kroner|kr|francs|franc|chf|cents|cent|копійок|копійки|копійка|bucks|buck';

const CURRENCY_SYMBOLS = '\\$|€|£|¥|₴|zł|kr|chf';
const DIGIT_AMOUNT_PATTERN = new RegExp(`(${CURRENCY_SYMBOLS})?\\s*\\d+([.,]\\d+)?\\s*(${CURRENCY_SYMBOLS}|${CURRENCY_WORDS})?`, 'giu');
const WORD_AMOUNT_PATTERN = new RegExp(`(${NUMBER_WORDS})(\\s+(${NUMBER_WORDS}))*\\s+(${CURRENCY_WORDS})`, 'giu');

export const stripAmountsFromText = (text: string): string =>
    text
        .replace(DIGIT_AMOUNT_PATTERN, ' ')
        .replace(WORD_AMOUNT_PATTERN, ' ')
        .replace(/\s+([.,!?])/gu, '$1')
        .replace(/\s{2,}/gu, ' ')
        .replace(/^[.,!?\s]+|[.,!?\s]+$/gu, '')
        .trim();
