import { LanguageEnum } from '@budgie/contracts';

const depositPayoutPhrases: Record<LanguageEnum, readonly string[]> = {
    [LanguageEnum.EN]: ['deposit payout', 'deposit maturity', 'deposit closing'],
    [LanguageEnum.FR]: ['échéance de dépôt', 'clôture de dépôt'],
    [LanguageEnum.UK]: ['виплата депозиту', 'виплата вкладу', 'закриття депозиту'],
    [LanguageEnum.DE]: ['festgeld auszahlung', 'auszahlung festgeld', 'festgeld fälligkeit', 'festgeld auflösung'],
    [LanguageEnum.ES]: ['pago de depósito', 'vencimiento de depósito', 'cierre de depósito']
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
