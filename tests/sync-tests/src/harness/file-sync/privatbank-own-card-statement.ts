import { AccountTypeEnum, ExternalSourceEnum, TransactionEntityTable } from '@budgie/contracts';
import {
    generateDefaultSyncAccountTitle,
    SyncAccountBalanceStateEnum,
    SyncAccountTypeEnum,
    SyncProviderEnum,
    privatbankTransactionMapper
} from '@budgie/sync';
import { and, isNull } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { testQueryService } from '../db/test-query-service';
import { testDb } from '../scenario/setup';
import { seed } from '../seed/seed';

import { makeStubFileBankSyncService } from './make-stub-file-bank-sync-service';

import type { TransactionEntityInterface } from '@budgie/contracts';
import type { FileBasedSyncClientInterface, PrivatbankRowInterface } from '@budgie/sync';

const OWN_CARD_OPERATED_AT = new Date('2026-03-04T09:15:00.000Z');

export const seedOwnCard = (card: string) =>
    seed.account({
        title: `Privatbank •${card.slice(-4)}`,
        type: AccountTypeEnum.BANK_SYNC,
        externalSource: ExternalSourceEnum.PRIVATBANK,
        externalId: card,
        iban: `UA00PRIVATBANK${card.slice(-4)}`
    });

export const buildOwnCardRow = (
    card: string,
    cardAmount: number,
    description: string,
    operatedAt = OWN_CARD_OPERATED_AT
): PrivatbankRowInterface => ({
    rawDate: operatedAt.toISOString(),
    date: operatedAt,
    deviceLocalDate: operatedAt,
    category: 'Перекази',
    card,
    description,
    cardAmount,
    cardCurrency: 'UAH',
    operationAmount: Math.abs(cardAmount),
    operationCurrency: 'UAH',
    endBalance: 0,
    balanceCurrency: 'UAH'
});

export const buildOwnCardStatementClient = (rows: PrivatbankRowInterface[]): FileBasedSyncClientInterface => ({
    getAccounts: () =>
        [...new Set(rows.map(row => row.card))].map(card => ({
            id: card,
            provider: SyncProviderEnum.PRIVATBANK,
            currencyCode: 'UAH',
            currencyCodeNumeric: 980,
            balance: 0,
            balanceState: SyncAccountBalanceStateEnum.REPRESENTABLE,
            creditLimit: 0,
            type: SyncAccountTypeEnum.CARD,
            maskedPan: [card]
        })),
    getTransactions: accountId => rows.filter(row => row.card === accountId).map(privatbankTransactionMapper)
});

export const makeOwnCardStatementService = (client: FileBasedSyncClientInterface) =>
    Effect.gen(function* () {
        const transferMcc = yield* testQueryService.findMccByCode('4829');

        return yield* makeStubFileBankSyncService(
            ExternalSourceEnum.PRIVATBANK,
            client,
            new Map([['Перекази', { id: transferMcc.id, defaultCategoryId: null }]]),
            { generateAccountTitle: account => generateDefaultSyncAccountTitle('Privatbank', account) }
        );
    });

export const fetchVisibleTransactions = () =>
    testDb
        .select()
        .from(TransactionEntityTable)
        .where(and(isNull(TransactionEntityTable.deletedAt), isNull(TransactionEntityTable.consolidationParentTransactionId)));

export const summarize = (transactions: Pick<TransactionEntityInterface, 'type' | 'fromAccountId' | 'toAccountId'>[]) =>
    transactions.map(transaction => [transaction.type, transaction.fromAccountId, transaction.toAccountId]);
