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
        'remboursement du compte à terme',
        'remboursement du dépôt à terme',
        'échéance du compte à terme',
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
        'cancelación de plazo fijo',
        'liquidación plazo fijo'
    ]
};

const interestStems: Record<LanguageEnum, readonly string[]> = {
    [LanguageEnum.EN]: ['interest'],
    [LanguageEnum.FR]: ['interet'],
    [LanguageEnum.UK]: ['відсот', 'процент'],
    [LanguageEnum.DE]: ['zins'],
    [LanguageEnum.ES]: ['interes']
};

const principalStems: Record<LanguageEnum, readonly string[]> = {
    [LanguageEnum.EN]: ['principal'],
    [LanguageEnum.FR]: ['capital'],
    [LanguageEnum.UK]: ['тіло', 'основн'],
    [LanguageEnum.DE]: ['kapital'],
    [LanguageEnum.ES]: ['capital']
};

const guaranteeStems: Record<LanguageEnum, readonly string[]> = {
    [LanguageEnum.EN]: ['guarantee', 'security deposit'],
    [LanguageEnum.FR]: ['garantie'],
    [LanguageEnum.UK]: ['застав', 'оренд'],
    [LanguageEnum.DE]: ['kaution'],
    [LanguageEnum.ES]: ['garantia', 'fianza']
};

const normalize = (value: string) =>
    value
        .toLowerCase()
        .normalize('NFD')
        .replaceAll(/\p{M}/gu, '')
        .replaceAll(/[^\p{L}\p{N}]+/gu, ' ')
        .trim();

const normalizeAll = (table: Record<LanguageEnum, readonly string[]>) => Object.values(table).flat().map(normalize);

const normalizedPhrases = normalizeAll(depositPayoutPhrases);

const normalizedInterestStems = normalizeAll(interestStems);

const normalizedPrincipalStems = normalizeAll(principalStems);

const normalizedGuaranteeStems = normalizeAll(guaranteeStems);

const containsAny = (title: string, stems: readonly string[]) => stems.some(stem => title.includes(stem));

export const isDepositPayoutTitle = (title: string) => {
    const normalizedTitle = ` ${normalize(title)} `;

    return (
        normalizedPhrases.some(phrase => normalizedTitle.includes(` ${phrase} `)) &&
        !containsAny(normalizedTitle, normalizedGuaranteeStems) &&
        (!containsAny(normalizedTitle, normalizedInterestStems) || containsAny(normalizedTitle, normalizedPrincipalStems))
    );
};
