const AUTO_PREFIXES = [
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

export const REFUND_TITLE_PREFIXES = {
    auto: AUTO_PREFIXES,
    rejectedPaymentFee: ['Повернення комісій', 'ПОВЕРНЕННЯ КОМІСІЙ'] as const,
    rejectedPaymentPrincipal: ['Повернення коштів за забракованим платежем', 'ПОВЕРНЕННЯ КОШТІВ ЗА ЗАБРАКОВАНИМ ПЛАТЕЖЕМ'] as const,
    review: [
        ...AUTO_PREFIXES,
        'REFUND ',
        'REFUND',
        'RETURN ',
        'RETURN',
        'REVERSAL ',
        'REVERSAL',
        'CHARGEBACK ',
        'CHARGEBACK',
        'CR '
    ] as const
};
