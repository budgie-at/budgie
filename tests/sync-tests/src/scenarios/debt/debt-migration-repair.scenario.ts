import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTestDb, makeTestPlatformLayer } from '@budgie-at/test-kit';
import {
    AccountBalanceRepository,
    DebtEventDirectionEnum,
    DebtEventRepository,
    DebtEventSourceEnum,
    TransactionRepository,
    TransactionTypeEnum,
    TransactionViewRepository
} from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { expect } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import { DebtMigrationBalanceAssertions } from './debt-migration-balance.assertions';
import { DebtMigrationEventAssertions } from './debt-migration-event.assertions';
import { DebtMigrationIdempotencyAssertions } from './debt-migration-idempotency.assertions';
import { DebtMigrationPersistenceAssertions } from './debt-migration-persistence.assertions';
import { DebtMigrationTransactionAssertions } from './debt-migration-transaction.assertions';

import type { AccountBalanceEntityInterface, DebtEventEntityInterface, TransactionWithEntriesEntityInterface } from '@budgie/contracts';

export class DebtMigrationRepairScenario {
    private static readonly AMBIGUOUS_ACCOUNT_ID = Number('102');
    private static readonly AMBIGUOUS_ADJUSTMENT_AMOUNT = 1_000_000_000;

    private static readonly AMBIGUOUS_LEDGER_BALANCE = -9_000_000_000;
    private static readonly AMBIGUOUS_ADJUSTMENT_TRANSACTION_ID = Number('1010');
    private static readonly AMBIGUOUS_OPENING_AMOUNT = Number('10000000000');
    private static readonly REPAIR_MIGRATION_PATH = resolve(
        fileURLToPath(import.meta.url),
        '../../../../../../packages/app/drizzle/0036_repair_borrowed_debt_migration.sql'
    );

    constructor(private readonly fixturePath: string) {}

    run() {
        return Effect.gen({ self: this }, function* () {
            const db = buildTestDb(this.fixturePath);
            yield* Effect.addFinalizer(() => Effect.promise(() => db.$client.closeAsync()));

            const repairMigrationSql = yield* Effect.promise(() => readFile(DebtMigrationRepairScenario.REPAIR_MIGRATION_PATH, 'utf8'));
            const firstExecutionSnapshot = yield* Effect.promise(() => new DebtMigrationPersistenceAssertions(db).assert());
            yield* Effect.promise(() => new DebtMigrationIdempotencyAssertions(db).assert(repairMigrationSql, firstExecutionSnapshot));
            yield* Effect.gen({ self: this }, function* () {
                yield* this.assertAmbiguousControl();
                yield* new DebtMigrationEventAssertions().assert();
                yield* new DebtMigrationTransactionAssertions().assert();
                yield* new DebtMigrationBalanceAssertions().assert();
            }).pipe(
                Effect.provide(
                    Layer.provideMerge(
                        Layer.mergeAll(
                            AccountBalanceRepository.layer,
                            DebtEventRepository.layer,
                            TransactionRepository.layer,
                            TransactionViewRepository.layer
                        ),
                        makeTestPlatformLayer(db)
                    )
                )
            );
        });
    }

    private assertAmbiguousControl() {
        return Effect.gen({ self: this }, function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const transactionRepository = yield* TransactionRepository;
            const debtEventRepository = yield* DebtEventRepository;
            const [accountBalance] = yield* accountBalanceRepository.getByAccountIds([DebtMigrationRepairScenario.AMBIGUOUS_ACCOUNT_ID]);
            const adjustmentTransaction = yield* transactionRepository.getByIdWithEntries(
                DebtMigrationRepairScenario.AMBIGUOUS_ADJUSTMENT_TRANSACTION_ID
            );
            const debtEvents = yield* debtEventRepository.findByAccountId(DebtMigrationRepairScenario.AMBIGUOUS_ACCOUNT_ID);

            this.assertAmbiguousBalance(accountBalance);
            this.assertAmbiguousAdjustment(adjustmentTransaction);
            this.assertAmbiguousEvents(debtEvents);
        });
    }

    private assertAmbiguousBalance(accountBalance: AccountBalanceEntityInterface | undefined): void {
        expect(accountBalance).toBeDefined();

        if (!isDefined(accountBalance)) {
            throw new Error('Migrated ambiguous debt balance was not hydrated');
        }

        expect({ accountId: accountBalance.accountId, amount: accountBalance.amount, deletedAt: accountBalance.deletedAt }).toEqual({
            accountId: DebtMigrationRepairScenario.AMBIGUOUS_ACCOUNT_ID,
            amount: DebtMigrationRepairScenario.AMBIGUOUS_LEDGER_BALANCE,
            deletedAt: null
        });
    }

    private assertAmbiguousAdjustment(adjustmentTransaction: TransactionWithEntriesEntityInterface | undefined): void {
        expect(adjustmentTransaction).toBeDefined();

        if (!isDefined(adjustmentTransaction)) {
            throw new Error('Migrated ambiguous debt adjustment was not hydrated');
        }

        expect({
            deletedAt: adjustmentTransaction.deletedAt,
            fromAccountId: adjustmentTransaction.fromAccountId,
            id: adjustmentTransaction.id,
            toAccountId: adjustmentTransaction.toAccountId,
            type: adjustmentTransaction.type
        }).toEqual({
            deletedAt: expect.any(Date),
            fromAccountId: null,
            id: DebtMigrationRepairScenario.AMBIGUOUS_ADJUSTMENT_TRANSACTION_ID,
            toAccountId: DebtMigrationRepairScenario.AMBIGUOUS_ACCOUNT_ID,
            type: TransactionTypeEnum.ADJUSTMENT
        });
        expect(adjustmentTransaction.entries).toHaveLength(0);
    }

    private assertAmbiguousEvents(debtEvents: DebtEventEntityInterface[]): void {
        const transactionBackedDebtEvents = debtEvents.filter(
            debtEvent => isDefined(debtEvent.transactionId) || isDefined(debtEvent.transactionEntryId)
        );

        expect(
            debtEvents
                .map(debtEvent => ({
                    amount: debtEvent.amount,
                    direction: debtEvent.direction,
                    source: debtEvent.source,
                    transactionEntryId: debtEvent.transactionEntryId,
                    transactionId: debtEvent.transactionId
                }))
                .sort((left, right) => left.direction.localeCompare(right.direction))
        ).toEqual([
            {
                amount: DebtMigrationRepairScenario.AMBIGUOUS_ADJUSTMENT_AMOUNT,
                direction: DebtEventDirectionEnum.CLOSE,
                source: DebtEventSourceEnum.MANUAL,
                transactionEntryId: null,
                transactionId: null
            },
            {
                amount: DebtMigrationRepairScenario.AMBIGUOUS_OPENING_AMOUNT,
                direction: DebtEventDirectionEnum.OPEN,
                source: DebtEventSourceEnum.MANUAL,
                transactionEntryId: null,
                transactionId: null
            }
        ]);
        expect(transactionBackedDebtEvents).toHaveLength(0);
    }
}
