export const ERSTE_EXTERNAL_ID_LENGTH = 32;
export const ERSTE_CURRENCY_CODE_EUR = 978;
export const ERSTE_CURRENCY_ALPHA_EUR = 'EUR';

export const ERSTE_LAYOUT_Y_ROW_TOLERANCE = 3;
export const ERSTE_LAYOUT_RIGHT_COLUMN_X_THRESHOLD = 250;
export const ERSTE_LAYOUT_FOOTER_Y_THRESHOLD = 50;

export const ERSTE_AMOUNT_ONLY_REGEX = /^(\d{1,3}(?:\.\d{3})*,\d{2})(-?)$/u;

export const ERSTE_MODERN_PAGE_NOISE_PATTERNS: readonly RegExp[] = [
    /^AT\d{18,20}\s+\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}\b/u,
    /^IBAN\s+Datum\/Date\s+Uhrzeit\/Time/u,
    /Auszug\/Statement\s+Seite\/Page/u
];
