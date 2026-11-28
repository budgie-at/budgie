import { LanguageEnum } from '@budgie/contracts';

const depositPayoutPhrases: Record<LanguageEnum, readonly string[]> = {
    [LanguageEnum.EN]: ['deposit payout', 'deposit maturity', 'deposit closing', 'deposit closure', 'matured deposit'],
    [LanguageEnum.FR]: [
        'échéance de dépôt',
        'clôture de dépôt',
        'échéance dépôt à terme',
        'remboursement dépôt à terme',
        'échéance compte à terme',
        'remboursement compte à terme',
        'clôture compte à terme'
    ],
    [LanguageEnum.UK]: ['виплата депозиту', 'виплата вкладу', 'закриття депозиту', 'закриття вкладу', 'завершення депозиту'],
    [LanguageEnum.DE]: [
        'festgeld auszahlung',
        'auszahlung festgeld',
        'festgeld fälligkeit',
        'festgeld auflösung',
        'rückzahlung festgeld',
        'festgeldauszahlung',
        'festgeldrückzahlung',
        'festgeldfälligkeit',
        'festgeldauflösung',
        'termingeld auszahlung',
        'termingeld fälligkeit'
    ],
    [LanguageEnum.ES]: [
        'pago de depósito',
        'vencimiento de depósito',
        'cierre de depósito',
        'cancelación de depósito',
        'liquidación de depósito',
        'vencimiento plazo fijo',
        'vencimiento de plazo fijo',
        'cancelación plazo fijo',
        'liquidación plazo fijo'
    ]
};

const normalize = (value: string) =>
    value
        .toLowerCase()
        .normalize('NFD')
        .replaceAll(/\p{M}/gu, '')
        .replaceAll(/[^\p{L}\p{N}]+/gu, ' ')
        .trim();

const normalizedPhrases = Object.values(depositPayoutPhrases).flat().map(normalize);

export const isDepositPayoutTitle = (title: string) => {
    const normalizedTitle = ` ${normalize(title)} `;

    return normalizedPhrases.some(phrase => normalizedTitle.includes(` ${phrase} `));
};
