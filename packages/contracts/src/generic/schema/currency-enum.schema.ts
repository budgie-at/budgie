import { enum as zodEnum } from 'zod';

import { CurrencyEnum } from '../enum/currency.enum';

export const CurrencyEnumSchema = zodEnum(CurrencyEnum);
