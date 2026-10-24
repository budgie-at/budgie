import { ExternalSourceEnum } from '@budgie/contracts';
import { SyncAccountBalanceStateEnum, SyncAccountTypeEnum, SyncProviderEnum, privatbankTransactionMapper } from '@budgie/sync';
import * as Effect from 'effect/Effect';

import { seed } from '../seed/seed';

import type { FileBasedSyncClientInterface, PrivatbankRowInterface, SyncAccountInterface, SyncTransactionInterface } from '@budgie/sync';

export const PRIVATBANK_CARD_ID = '4731 **** **** 5524';
export const PRIVATBANK_STATEMENT_URI = 'privatbank-statement.xlsx';

const buildPrivatbankBankAccount = (): SyncAccountInterface => ({
    id: PRIVATBANK_CARD_ID,
    provider: SyncProviderEnum.PRIVATBANK,
    currencyCode: 'UAH',
    currencyCodeNumeric: 980,
    balance: 0,
    balanceState: SyncAccountBalanceStateEnum.REPRESENTABLE,
    creditLimit: 0,
    type: SyncAccountTypeEnum.CARD
});

export const buildPrivatbankRow = (): PrivatbankRowInterface => ({
    rawDate: '19.05.2026 08:40:18',
    date: new Date('2026-05-19T05:40:18.000Z'),
    deviceLocalDate: new Date('2026-05-19T06:40:18.000Z'),
    category: 'Комуналка та Інтернет',
    card: PRIVATBANK_CARD_ID,
    description: 'TRANZZO*NICUA*AGPAY, DNIPRO',
    cardAmount: -732.44,
    cardCurrency: 'UAH',
    operationAmount: 732.44,
    operationCurrency: 'UAH',
    endBalance: 12_345.67,
    balanceCurrency: 'UAH'
});

export class StubPrivatbankFileClient implements FileBasedSyncClientInterface {
    private readonly transaction = privatbankTransactionMapper(buildPrivatbankRow());

    getAccounts(): SyncAccountInterface[] {
        return [buildPrivatbankBankAccount()];
    }

    getTransactions(accountId: string): SyncTransactionInterface[] {
        return accountId === PRIVATBANK_CARD_ID ? [this.transaction] : [];
    }
}

export const seedPrivatbankAccount = () =>
    Effect.gen(function* () {
        const account = yield* seed.account({
            title: 'Privatbank Card',
            externalId: PRIVATBANK_CARD_ID,
            externalSource: ExternalSourceEnum.PRIVATBANK
        });

        return account.id;
    });
