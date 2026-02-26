import { CurrencyEnum } from '@budgie/contracts';

const CURRENCY_ENUM_VALUES = new Set<string>(Object.values(CurrencyEnum));

export const isCurrencyEnum = (value: string): value is CurrencyEnum => CURRENCY_ENUM_VALUES.has(value);
