import { number , object, enum as zodEnum } from 'zod';

import { CurrencyEnum } from '../../../generic/enum/currency.enum';

export const BaseAccountFieldsSchema = object({
    balance: number().describe('Current balance of the account.'),
    currency: zodEnum(CurrencyEnum).describe('Currency of the account.')
});
