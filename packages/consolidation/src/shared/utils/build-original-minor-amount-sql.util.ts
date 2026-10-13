import { PRECISION } from '@budgie/contracts';

export const buildOriginalMinorAmountSql = (amount: string, exchangeRate: string): string =>
    `ROUND(${amount} / ${exchangeRate} / ${PRECISION / 100})`;
