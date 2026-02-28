export const ERSTE_EXTERNAL_ID_LENGTH = 32;
export const ERSTE_CURRENCY_CODE_EUR = 978;

export const ERSTE_IBAN_REGEX = /AT\d{18,20}/u;
export const ERSTE_ACCOUNT_NUMBER_REGEX = /(\d{3}-\d{3}-\d{3}\/\d{2})/u;

export const ERSTE_MODERN_FORMAT_MARKER = 'Buchungstext/Booking Text';
export const ERSTE_MODERN_TRANSACTION_DATE_REGEX = /^(\d{2})\.(\d{2})\.(\d{4})\s+([\d.,]+)(-)?$/u;
export const ERSTE_MODERN_END_MARKER = 'Neuer Kontostand/New Balance';
