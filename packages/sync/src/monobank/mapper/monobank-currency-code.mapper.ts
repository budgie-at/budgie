import { CURRENCY_CODE_BY_NUMERIC_CODE } from '../../core/constant/currency-code-by-numeric-code.constant';

export const monobankCurrencyCodeMapper = (numericCode: number): string => CURRENCY_CODE_BY_NUMERIC_CODE.get(numericCode) ?? 'XXX';
