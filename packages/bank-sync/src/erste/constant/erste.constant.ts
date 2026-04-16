export const ERSTE_EXTERNAL_ID_LENGTH = 32;
export const ERSTE_CURRENCY_CODE_EUR = 978;

export const ERSTE_IBAN_REGEX = /AT\d{18,20}/u;
export const ERSTE_ACCOUNT_NUMBER_REGEX = /(\d{3}-\d{3}-\d{3}\/\d{2})/u;

export const ERSTE_MODERN_FORMAT_MARKER = 'Buchungstext/Booking Text';
export const ERSTE_MODERN_TRANSACTION_DATE_REGEX = /^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{1,3}(?:\.\d{3})*,\d{2})(-)?$/u;
export const ERSTE_MODERN_INLINE_TRANSACTION_TAIL_REGEX = /(\d{2})\.(\d{2})\.(\d{4})\s+(\d{1,3}(?:\.\d{3})*,\d{2})(-)?$/u;
export const ERSTE_MODERN_FULL_DATE_REGEX = /\b\d{2}\.\d{2}\.\d{4}\b/u;
export const ERSTE_MODERN_END_MARKER = 'Neuer Kontostand/New Balance';
export const ERSTE_MODERN_BALANCE_SEARCH_LINES_LIMIT = 3;
export const ERSTE_MODERN_BALANCE_AMOUNT_REGEX = /^\d[\d.,]*$/u;
export const ERSTE_MODERN_NOTE_HEADER_MARKERS = ['Abschlussbuchung', 'Reklamationen bitte binnen'] as const;
