const REFERENCE_PATTERNS = [/\bREF[#:]?\w*/giu, /#\w{4,}/gu, /\b\d{5,}\b/gu];

const AMOUNT_PATTERNS = [
    /\b(?:USD|EUR|GBP|UAH|CHF|CAD|AUD|JPY|PLN|CZK)\s*\d+[.,]?\d*/giu,
    /[$\u20AC\u00A3\u20B4\u00A5]\s*\d+[.,]?\d*/gu,
    /(?<!\d[.,])\b\d+[.,]\d{2}(?![.,]\d)\b/gu
];

const DATE_PATTERNS = [/\b\d{1,2}[/.]\d{1,2}([/.]\d{2,4})?\b/gu, /\b\d{4}-\d{2}-\d{2}\b/gu, /\b\d{2}-\d{2}-\d{4}\b/gu];

const SUFFIX_PATTERN = /\.?\b(?:COM|NET|ORG|INC|LLC|LTD|GMBH|CO|CORP|PLC|SA|AG|SRL|PTY)\b\.?/giu;

const EXTRA_WHITESPACE = /\s{2,}/gu;
const LEADING_TRAILING_SEPARATORS = /^[\s*\-_.,/]+|[\s*\-_.,/]+$/gu;

const MINIMUM_CLEANED_LENGTH = 3;

export const cleanMerchantTitle = (title: string): string => {
    let cleaned = title;

    for (const pattern of REFERENCE_PATTERNS) {
        cleaned = cleaned.replace(pattern, ' ');
    }

    for (const pattern of AMOUNT_PATTERNS) {
        cleaned = cleaned.replace(pattern, ' ');
    }

    for (const pattern of DATE_PATTERNS) {
        cleaned = cleaned.replace(pattern, ' ');
    }

    cleaned = cleaned.replace(SUFFIX_PATTERN, ' ');
    cleaned = cleaned.replace(EXTRA_WHITESPACE, ' ');
    cleaned = cleaned.replace(LEADING_TRAILING_SEPARATORS, '');

    if (cleaned.length < MINIMUM_CLEANED_LENGTH) {
        return title.trim();
    }

    return cleaned;
};
