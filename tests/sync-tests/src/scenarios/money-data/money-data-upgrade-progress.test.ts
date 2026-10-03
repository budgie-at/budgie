import { MoneyDataUpgradeService } from '@app/money-data/service/money-data-upgrade.service';
import {
    AccountTypeEnum,
    CurrencyEnum,
    SettingsEntityTable,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { requireInstrument, seed, testDb, TestLayer } from '../../harness';

import type { MoneyDataUpgradeRuntimeSnapshotInterface } from '@app/money-data/interface/money-data-upgrade-runtime-snapshot.interface';

const PENDING_DAY_COUNT = 60;
const ENTRIES_PER_DAY = 2;
const DAY_MS = 86_400_000;
const FIRST_PENDING_DAY = new Date('2025-01-01T12:00:00.000Z');

const seedPendingEntries = (accountId: number) =>
    Effect.gen(function* () {
        const transactions = yield* testDb
            .insert(TransactionEntityTable)
            .values(
                Array.from({ length: PENDING_DAY_COUNT * ENTRIES_PER_DAY }, (_, index) => ({
                    type: TransactionTypeEnum.EXPENSE,
                    title: `Pending ${index}`,
                    operatedAt: new Date(FIRST_PENDING_DAY.getTime() + (index % PENDING_DAY_COUNT) * DAY_MS),
                    comment: '',
                    fromAccountId: accountId,
                    toAccountId: null,
                    exchangeRate: 1,
                    externalId: null,
                    externalSource: null,
                    updatedBy: null
                }))
            )
            .returning();

        yield* testDb.insert(TransactionEntryEntityTable).values(
            transactions.map(transaction => ({
                transactionId: transaction.id,
                accountId,
                type: TransactionEntryTypeEnum.CREDIT,
                amount: 1000,
                categoryId: null,
                mccCategoryId: null,
                externalId: null,
                exchangeRate: 1,
                baseInstrumentId: null,
                baseExchangeRate: null,
                baseAmount: null,
                toIban: null
            }))
        );

        return transactions.length;
    });

describe('money data upgrade progress', () => {
    it.effect('reports processed entries after every valued bucket, monotonically from 0 to the total', () =>
        Effect.gen(function* () {
            const moneyDataUpgradeService = yield* MoneyDataUpgradeService;
            const euro = yield* requireInstrument(CurrencyEnum.EUR);
            const hryvnia = yield* requireInstrument(CurrencyEnum.UAH);
            const account = yield* seed.account({ type: AccountTypeEnum.BANK, instrumentId: hryvnia.id });
            const totalEntryCount = yield* seedPendingEntries(account.id);
            const snapshots: MoneyDataUpgradeRuntimeSnapshotInterface[] = [];

            yield* testDb.update(SettingsEntityTable).set({ defaultInstrumentId: euro.id });

            const result = yield* moneyDataUpgradeService.run(snapshot => {
                snapshots.push(snapshot);
            });
            const valuingCounts = snapshots
                .filter(snapshot => snapshot.isRunning && !snapshot.isUpdatingBalances && snapshot.totalEntryCount === totalEntryCount)
                .map(snapshot => snapshot.processedEntryCount);

            expect(valuingCounts).toStrictEqual(
                Array.from({ length: PENDING_DAY_COUNT + 1 }, (_, bucketIndex) => bucketIndex * ENTRIES_PER_DAY)
            );
            expect(result).toMatchObject({ isRunning: false, processedEntryCount: totalEntryCount, pendingEntryCount: 0 });
            expect(yield* moneyDataUpgradeService.getSnapshot()).toMatchObject({ pendingEntryCount: 0 });
        }).pipe(Effect.provide(TestLayer))
    );
});
