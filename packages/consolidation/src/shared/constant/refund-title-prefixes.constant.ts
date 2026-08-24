export const REJECTED_PAYMENT_PRINCIPAL_TITLE_PREFIXES = [
    'Повернення коштів за забракованим платежем',
    'ПОВЕРНЕННЯ КОШТІВ ЗА ЗАБРАКОВАНИМ ПЛАТЕЖЕМ'
] as const;

export const REJECTED_PAYMENT_FEE_TITLE_PREFIXES = ['Повернення комісій', 'ПОВЕРНЕННЯ КОМІСІЙ'] as const;

export const AUTO_TITLE_PREFIXES = [
    'Скасування. ',
    'Скасування.',
    'Скасування ',
    'СКАСУВАННЯ. ',
    'СКАСУВАННЯ ',
    'ПОВЕРНЕННЯ КОШТІВ, ',
    'Повернення коштів, ',
    'ПОВЕРНЕННЯ ПЛАТЕЖУ ',
    'Повернення платежу ',
    'ПОВЕРНЕННЯ ТОВАРУ ',
    'Повернення товару ',
    'ПОВЕРНЕННЯ, ',
    'Повернення, ',
    'ПОВЕРНЕННЯ ',
    'Повернення ',
    'ПЛАТІЖ ',
    'Платіж '
] as const;

export const REVIEW_TITLE_PREFIXES = [
    ...AUTO_TITLE_PREFIXES,
    'REFUND ',
    'REFUND',
    'RETURN ',
    'RETURN',
    'REVERSAL ',
    'REVERSAL',
    'CHARGEBACK ',
    'CHARGEBACK',
    'CR '
] as const;
