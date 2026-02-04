import { BankProviderEnum } from '../../core/enum/bank-provider.enum';
import { BankTransactionTypeEnum } from '../../core/enum/bank-transaction-type.enum';
import { ERSTE_CURRENCY_CODE_EUR } from '../constant/erste.constant';
import { generateErsteExternalId } from '../util/generate-erste-external-id.util';

import type { BankTransactionInterface } from '../../core/interface/bank-transaction.interface';
import type { ErsteRowInterface } from '../interface/erste-row.interface';

const MILLISECONDS_TO_SECONDS_DIVISOR = 1000;

const getTransactionType = (isCredit: boolean): BankTransactionTypeEnum =>
    isCredit ? BankTransactionTypeEnum.INCOME : BankTransactionTypeEnum.EXPENSE;

export const ersteTransactionMapper = (row: ErsteRowInterface, iban: string): BankTransactionInterface => ({
    id: generateErsteExternalId(row, iban),
    provider: BankProviderEnum.ERSTE,
    accountId: iban,
    type: getTransactionType(row.isCredit),
    time: Math.floor(row.date.getTime() / MILLISECONDS_TO_SECONDS_DIVISOR),
    description: row.description,
    mcc: 0,
    originalMcc: 0,
    amount: Math.abs(row.amount),
    operationAmount: Math.abs(row.amount),
    currencyCode: ERSTE_CURRENCY_CODE_EUR,
    commissionRate: 0,
    cashbackAmount: 0,
    balance: 0,
    hold: false,
    category: row.details
});
