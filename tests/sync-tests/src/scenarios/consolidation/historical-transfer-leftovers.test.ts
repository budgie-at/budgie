import {
    AccountEntityTable,
    AccountTypeEnum,
    ExternalSourceEnum,
    TransactionConsolidationTypeEnum,
    TransactionCreateEntityInterface,
    TransactionEntityInterface,
    TransactionEntityTable,
    TransactionEntryCreateEntityInterface,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { SyncRepairService, TransferConsolidationService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { and, eq, isNull } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import {
    fetchCanonicalsOfType,
    fetchTransactionById,
    findMccByCode,
    seed,
    seedBankPair,
    seedExchangeRate,
    testDb,
    TestLayer,
    expectParentedToCanonical
} from '../../harness';

const SOURCE_IBAN = 'UA-FOP-EUR';
const BRIDGE_IBAN = 'UA-FOP-UAH';
const BLACK_IBAN = 'UA-BLACK-UAH';
const PRIVAT_IBAN = 'UA-PRIVAT-UAH';
const EUR_AMOUNT = 238_000_000;
const UAH_AMOUNT = 11_745_300_000;
const EUR_TO_UAH_RATE = UAH_AMOUNT / EUR_AMOUNT;
const APPROXIMATE_SOURCE_AMOUNT = 290_300_000;
const APPROXIMATE_TRANSFER_TARGET_AMOUNT = 14_840_136_000;
const APPROXIMATE_PRIVAT_INCOME_AMOUNT = 14_790_780_000;
const SAME_BANK_CURRENCY_SOURCE_AMOUNT = 276_500_000;
const SAME_BANK_CURRENCY_TARGET_AMOUNT = 13_272_000_000;

const seedHistoricalBridgeAccounts = () =>
    Effect.gen(function* () {
        const eur = yield* seed.instrument({ code: 'EUR', name: 'Euro', symbol: '€' });
        const sourceAccount = yield* seed.account({
            title: 'Monobank Fop EUR',
            type: AccountTypeEnum.BANK_SYNC,
            iban: SOURCE_IBAN,
            instrumentId: eur.id
        });
        const bridgeAccount = yield* seed.account({ title: 'Monobank Fop UAH', type: AccountTypeEnum.BANK_SYNC, iban: BRIDGE_IBAN });
        const targetAccount = yield* seed.account({ title: 'Monobank Black', type: AccountTypeEnum.BANK_SYNC, iban: BLACK_IBAN });

        yield* seedExchangeRate(eur.id, bridgeAccount.instrumentId, EUR_TO_UAH_RATE);

        return { sourceAccount, bridgeAccount, targetAccount };
    });

const seedTransfer = (
    title: string,
    operatedAt: Date,
    fromAccountId: number,
    toAccountId: number,
    amount: number,
    consolidationType: TransactionConsolidationTypeEnum | null = null
) =>
    Effect.gen(function* () {
        const [transfer] = yield* testDb
            .insert(TransactionEntityTable)
            .values({
                type: TransactionTypeEnum.TRANSFER,
                title,
                externalId: null,
                externalSource: null,
                operatedAt,
                exchangeRate: 1,
                fromAccountId,
                toAccountId,
                comment: '',
                needsEmbedding: false,
                consolidationParentTransactionId: null,
                consolidationType,
                updatedBy: null
            } satisfies TransactionCreateEntityInterface)
            .returning();

        yield* testDb.insert(TransactionEntryEntityTable).values([
            {
                transactionId: transfer.id,
                accountId: fromAccountId,
                categoryId: null,
                mccCategoryId: null,
                type: TransactionEntryTypeEnum.CREDIT,
                amount,
                externalId: null,
                exchangeRate: 1,
                toIban: null,
                originalTransactionId: null
            },
            {
                transactionId: transfer.id,
                accountId: toAccountId,
                categoryId: null,
                mccCategoryId: null,
                type: TransactionEntryTypeEnum.DEBIT,
                amount,
                externalId: null,
                exchangeRate: 1,
                toIban: null,
                originalTransactionId: null
            }
        ] satisfies TransactionEntryCreateEntityInterface[]);

        return transfer;
    });

const seedMovedSourceEntry = (canonicalTransactionId: number, accountId: number) =>
    Effect.gen(function* () {
        const movedSource = yield* seedBankPair.expense(
            { externalId: 'already-moved-source', operatedAt: new Date(2026, 0, 4) },
            { accountId, amount: 1_000_000 }
        );

        yield* testDb.insert(TransactionEntryEntityTable).values({
            transactionId: canonicalTransactionId,
            accountId,
            categoryId: null,
            mccCategoryId: null,
            type: TransactionEntryTypeEnum.CREDIT,
            amount: 1_000_000,
            externalId: 'already-moved-source',
            exchangeRate: 1,
            toIban: null,
            originalTransactionId: movedSource.id
        } satisfies TransactionEntryCreateEntityInterface);

        yield* testDb
            .update(TransactionEntityTable)
            .set({ consolidationParentTransactionId: canonicalTransactionId })
            .where(eq(TransactionEntityTable.id, movedSource.id));

        return movedSource;
    });

const archiveAccount = (accountId: number) =>
    Effect.gen(function* () {
        yield* testDb
            .update(AccountEntityTable)
            .set({ includeInNetWorth: false, isActive: false })
            .where(eq(AccountEntityTable.id, accountId));
    });

const setTransactionExternalSource = (transactionId: number, externalSource: ExternalSourceEnum) =>
    Effect.gen(function* () {
        yield* testDb.update(TransactionEntityTable).set({ externalSource }).where(eq(TransactionEntityTable.id, transactionId));
    });

const seedExistingTransferBridgeCandidate = (
    externalIdPrefix: string,
    title: string,
    consolidationType: TransactionConsolidationTypeEnum | null = null
) =>
    Effect.gen(function* () {
        const operatedAt = new Date(2026, 0, 5, 13, 56, 33);
        const { bridgeAccount, sourceAccount, targetAccount } = yield* seedHistoricalBridgeAccounts();
        const sourceExpense = yield* seedBankPair.expense(
            { externalId: `${externalIdPrefix}-expense`, operatedAt: new Date(operatedAt.getTime() + 1000) },
            { accountId: sourceAccount.id, amount: EUR_AMOUNT }
        );
        const bridgeIncome = yield* seedBankPair.income(
            { externalId: `${externalIdPrefix}-income`, operatedAt },
            { accountId: bridgeAccount.id, amount: UAH_AMOUNT }
        );
        const existingCardTransfer = yield* seedTransfer(
            title,
            operatedAt,
            bridgeAccount.id,
            targetAccount.id,
            UAH_AMOUNT,
            consolidationType
        );

        return { bridgeAccount, bridgeIncome, existingCardTransfer, sourceAccount, sourceExpense, targetAccount };
    });

const seedSameCurrencyPrivatArchivedTargetDuplicate = () =>
    Effect.gen(function* () {
        const operatedAt = new Date(2026, 0, 5, 13, 56, 56);
        const transferMcc = yield* findMccByCode('4829');
        const sourceAccount = yield* seed.account({
            title: 'Monobank Black',
            type: AccountTypeEnum.BANK_SYNC,
            iban: BLACK_IBAN,
            externalSource: ExternalSourceEnum.MONOBANK
        });
        const archivedTargetAccount = yield* seed.account({ title: 'приватбанк UAH', type: AccountTypeEnum.BANK });
        const privatAccount = yield* seed.account({
            title: 'Privatbank •5524',
            type: AccountTypeEnum.BANK_SYNC,
            iban: PRIVAT_IBAN
        });
        const existingTransfer = yield* seedTransfer('Приват Сина', operatedAt, sourceAccount.id, archivedTargetAccount.id, UAH_AMOUNT);

        yield* archiveAccount(archivedTargetAccount.id);
        yield* setTransactionExternalSource(existingTransfer.id, ExternalSourceEnum.MONOBANK);

        const privatIncome = yield* seedBankPair.income(
            { externalId: 'same-currency-privat-income', operatedAt: new Date(operatedAt.getTime() + 2 * 60 * 60 * 1000) },
            { accountId: privatAccount.id, amount: UAH_AMOUNT, mccCategoryId: transferMcc.id }
        );

        yield* testDb
            .update(TransactionEntityTable)
            .set({ externalSource: ExternalSourceEnum.PRIVATBANK, title: 'від YEHOROV IHOR' })
            .where(eq(TransactionEntityTable.id, privatIncome.id));

        return { archivedTargetAccount, existingTransfer, privatAccount, privatIncome };
    });

const seedSameCurrencyPrivatArchivedSyncedTargetDuplicate = () =>
    Effect.gen(function* () {
        const candidate = yield* seedSameCurrencyPrivatArchivedTargetDuplicate();

        yield* testDb
            .update(AccountEntityTable)
            .set({
                iban: 'UA-ARCHIVED-PRIVAT',
                type: AccountTypeEnum.BANK_SYNC
            })
            .where(eq(AccountEntityTable.id, candidate.archivedTargetAccount.id));

        return candidate;
    });

const seedLegacyCsvDeletedSourcePrivatDuplicate = () =>
    Effect.gen(function* () {
        const operatedAt = new Date(2025, 9, 23, 9, 56, 45);
        const transferMcc = yield* findMccByCode('4829');
        const sourceAccount = yield* seed.account({ title: 'monobank EUR', type: AccountTypeEnum.BANK });
        const archivedTargetAccount = yield* seed.account({ title: 'приватбанк UAH', type: AccountTypeEnum.BANK });
        const privatAccount = yield* seed.account({
            title: 'Privatbank •0356',
            type: AccountTypeEnum.BANK_SYNC,
            iban: PRIVAT_IBAN
        });
        const existingTransfer = yield* seedTransfer('', operatedAt, sourceAccount.id, archivedTargetAccount.id, UAH_AMOUNT);
        const deletedAt = new Date(2026, 0, 1);

        yield* testDb.update(AccountEntityTable).set({ deletedAt }).where(eq(AccountEntityTable.id, sourceAccount.id));
        yield* testDb
            .update(TransactionEntryEntityTable)
            .set({ deletedAt })
            .where(
                and(
                    eq(TransactionEntryEntityTable.transactionId, existingTransfer.id),
                    eq(TransactionEntryEntityTable.accountId, sourceAccount.id)
                )
            );
        yield* archiveAccount(archivedTargetAccount.id);
        yield* setTransactionExternalSource(existingTransfer.id, ExternalSourceEnum.CSV);

        const privatIncome = yield* seedBankPair.income(
            { externalId: 'legacy-csv-privat-income', operatedAt: new Date(operatedAt.getTime() + 2 * 60 * 60 * 1000 + 17_000) },
            { accountId: privatAccount.id, amount: UAH_AMOUNT, mccCategoryId: transferMcc.id }
        );

        yield* testDb
            .update(TransactionEntityTable)
            .set({ externalSource: ExternalSourceEnum.PRIVATBANK, title: 'від IHOR YEHOROV' })
            .where(eq(TransactionEntityTable.id, privatIncome.id));

        return { archivedTargetAccount, existingTransfer, privatAccount, privatIncome, sourceAccount };
    });

const fetchMovedSourceIds = (canonicalId: number) =>
    Effect.gen(function* () {
        const entries = yield* testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.transactionId, canonicalId));

        return entries.flatMap(entry => (entry.originalTransactionId ? [entry.originalTransactionId] : []));
    });

const fetchLiveDebitEntry = (transactionId: number) =>
    Effect.gen(function* () {
        return yield* testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(
                and(
                    eq(TransactionEntryEntityTable.transactionId, transactionId),
                    eq(TransactionEntryEntityTable.type, TransactionEntryTypeEnum.DEBIT),
                    isNull(TransactionEntryEntityTable.originalTransactionId),
                    isNull(TransactionEntryEntityTable.deletedAt)
                )
            );
    });

const expectSingleCanonicalOfType = (consolidationType: TransactionConsolidationTypeEnum, fromAccountId: number, toAccountId: number) =>
    Effect.gen(function* () {
        const canonicals = yield* fetchCanonicalsOfType(consolidationType);

        expect(canonicals).toHaveLength(1);
        expect(canonicals[0].fromAccountId).toBe(fromAccountId);
        expect(canonicals[0].toAccountId).toBe(toAccountId);

        return canonicals[0].id;
    });

const expectSingleIbanBridgeCanonical = (fromAccountId: number, toAccountId: number) =>
    Effect.gen(function* () {
        return yield* expectSingleCanonicalOfType(TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER, fromAccountId, toAccountId);
    });

const expectSingleTransferPairCanonical = (fromAccountId: number, toAccountId: number) =>
    Effect.gen(function* () {
        return yield* expectSingleCanonicalOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR, fromAccountId, toAccountId);
    });

const expectMovedSourceIds = (canonicalId: number, transactionIds: readonly number[]) =>
    Effect.gen(function* () {
        expect((yield* fetchMovedSourceIds(canonicalId)).sort((left, right) => left - right)).toEqual(
            [...transactionIds].sort((left, right) => left - right)
        );
    });

const expectIncomeDuplicateNested = (existingTransfer: TransactionEntityInterface, duplicateIncome: TransactionEntityInterface) =>
    Effect.gen(function* () {
        const canonicals = yield* fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);

        expect(canonicals).toHaveLength(1);
        expect(canonicals[0].id).not.toBe(existingTransfer.id);
        expect((yield* fetchTransactionById(existingTransfer.id)).consolidationType).toBeNull();
        yield* expectParentedToCanonical(canonicals[0].id, [existingTransfer.id, duplicateIncome.id]);
        expect([...new Set(yield* fetchMovedSourceIds(canonicals[0].id))].sort((left, right) => left - right)).toEqual(
            [existingTransfer.id, duplicateIncome.id].sort((left, right) => left - right)
        );

        return canonicals[0].id;
    });

const expectIncomeDuplicateConsolidated = Effect.fnUntraced(function* (
    existingTransfer: TransactionEntityInterface,
    duplicateIncome: TransactionEntityInterface
) {
    const transferConsolidationService = yield* TransferConsolidationService;
    const result = yield* transferConsolidationService.consolidate(null);

    expect(result).toEqual({ found: 1, consolidated: 1 });

    return yield* expectIncomeDuplicateNested(existingTransfer, duplicateIncome);
});

const expectPrivatTargetRouted = (canonicalId: number, privatAccountId: number, amount: number) =>
    Effect.gen(function* () {
        const canonical = yield* fetchTransactionById(canonicalId);
        const [debitEntry] = yield* fetchLiveDebitEntry(canonicalId);

        expect(canonical.toAccountId).toBe(privatAccountId);
        expect(debitEntry?.accountId).toBe(privatAccountId);
        expect(debitEntry?.amount).toBe(amount);
    });

const expectExistingTransferBridgeConsolidated = Effect.fnUntraced(function* (
    candidate: Effect.Success<ReturnType<typeof seedExistingTransferBridgeCandidate>>
) {
    const transferConsolidationService = yield* TransferConsolidationService;
    const result = yield* transferConsolidationService.consolidate(null);

    expect(result).toEqual({ found: 1, consolidated: 1 });

    const canonicalId = yield* expectSingleIbanBridgeCanonical(candidate.sourceAccount.id, candidate.targetAccount.id);
    yield* expectParentedToCanonical(canonicalId, [
        candidate.sourceExpense.id,
        candidate.bridgeIncome.id,
        candidate.existingCardTransfer.id
    ]);
    yield* expectMovedSourceIds(canonicalId, [
        candidate.sourceExpense.id,
        candidate.bridgeIncome.id,
        candidate.existingCardTransfer.id,
        candidate.existingCardTransfer.id
    ]);

    return canonicalId;
});

describe('consolidation/historical-transfer-leftovers', () => {
    it.effect('consolidates a same-bank FOP currency conversion with bank-derived amounts', () =>
        Effect.gen(function* () {
            const operatedAt = new Date(2025, 9, 14, 12, 27, 41);
            const eur = yield* seed.instrument({ code: 'EUR', name: 'Euro', symbol: '€' });
            const sourceAccount = yield* seed.account({
                title: 'Monobank Fop EUR',
                type: AccountTypeEnum.BANK_SYNC,
                externalSource: ExternalSourceEnum.MONOBANK,
                iban: SOURCE_IBAN,
                instrumentId: eur.id
            });
            const targetAccount = yield* seed.account({
                title: 'Monobank Fop UAH',
                type: AccountTypeEnum.BANK_SYNC,
                iban: BRIDGE_IBAN
            });
            const sourceExpense = yield* seedBankPair.expense(
                { externalId: 'fop-eur-sale', operatedAt },
                { accountId: sourceAccount.id, amount: SAME_BANK_CURRENCY_SOURCE_AMOUNT }
            );
            const targetIncome = yield* seedBankPair.income(
                { externalId: 'fop-uah-receipt', operatedAt },
                { accountId: targetAccount.id, amount: SAME_BANK_CURRENCY_TARGET_AMOUNT }
            );

            const transferConsolidationService = yield* TransferConsolidationService;
            const result = yield* transferConsolidationService.consolidate(null);

            expect(result).toEqual({ found: 1, consolidated: 1 });
            const canonicalId = yield* expectSingleTransferPairCanonical(sourceAccount.id, targetAccount.id);
            yield* expectParentedToCanonical(canonicalId, [sourceExpense.id, targetIncome.id]);
            expect(yield* fetchMovedSourceIds(canonicalId)).toEqual([sourceExpense.id, targetIncome.id]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('folds a past currency-exchange bridge leftover into the existing card transfer', () =>
        Effect.gen(function* () {
            const candidate = yield* seedExistingTransferBridgeCandidate(
                'eur-to-uah',
                'На чорну картку',
                TransactionConsolidationTypeEnum.TRANSFER_PAIR
            );

            yield* expectExistingTransferBridgeConsolidated(candidate);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('folds an existing card transfer that already owns same-currency sources', () =>
        Effect.gen(function* () {
            const candidate = yield* seedExistingTransferBridgeCandidate(
                'canonical-bridge',
                'Canonical transfer',
                TransactionConsolidationTypeEnum.TRANSFER_PAIR
            );
            const movedSource = yield* seedMovedSourceEntry(candidate.existingCardTransfer.id, candidate.bridgeAccount.id);

            yield* expectExistingTransferBridgeConsolidated(candidate);
            expect(yield* fetchMovedSourceIds(candidate.existingCardTransfer.id)).toEqual([movedSource.id]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not fold a leaf source transaction that already owns moved source entries', () =>
        Effect.gen(function* () {
            const { existingCardTransfer, sourceAccount, sourceExpense, bridgeIncome } = yield* seedExistingTransferBridgeCandidate(
                'canonical-source',
                'Canonical transfer',
                null
            );
            const movedSource = yield* seedMovedSourceEntry(sourceExpense.id, sourceAccount.id);

            const transferConsolidationService = yield* TransferConsolidationService;
            const result = yield* transferConsolidationService.consolidate(null);

            expect(result).toEqual({ found: 1, consolidated: 0 });
            expect((yield* fetchTransactionById(sourceExpense.id)).consolidationParentTransactionId).toBeNull();
            expect((yield* fetchTransactionById(bridgeIncome.id)).consolidationParentTransactionId).toBeNull();
            expect((yield* fetchTransactionById(existingCardTransfer.id)).consolidationParentTransactionId).toBeNull();
            expect(yield* fetchMovedSourceIds(sourceExpense.id)).toEqual([movedSource.id]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('nests the closest past income duplicate with an existing same-currency transfer', () =>
        Effect.gen(function* () {
            const operatedAt = new Date(2026, 0, 5, 13, 56, 56);
            const sourceAccount = yield* seed.account({
                title: 'Monobank Black',
                type: AccountTypeEnum.BANK_SYNC,
                iban: BLACK_IBAN
            });
            const targetAccount = yield* seed.account({
                title: 'Privatbank',
                type: AccountTypeEnum.BANK_SYNC,
                iban: PRIVAT_IBAN
            });
            const transferMcc = yield* findMccByCode('4829');
            const existingTransfer = yield* seedTransfer('Приват Сина', operatedAt, sourceAccount.id, targetAccount.id, UAH_AMOUNT);
            const closestIncome = yield* seedBankPair.income(
                { externalId: 'privat-income-closest', operatedAt: new Date(operatedAt.getTime() + 60 * 60 * 1000) },
                { accountId: targetAccount.id, amount: UAH_AMOUNT, mccCategoryId: transferMcc.id }
            );
            const laterIncome = yield* seedBankPair.income(
                { externalId: 'privat-income-later', operatedAt: new Date(operatedAt.getTime() + 2 * 60 * 60 * 1000) },
                { accountId: targetAccount.id, amount: UAH_AMOUNT, mccCategoryId: transferMcc.id }
            );

            yield* expectIncomeDuplicateConsolidated(existingTransfer, closestIncome);
            expect((yield* fetchTransactionById(laterIncome.id)).consolidationParentTransactionId).toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('nests a target income duplicate with an existing cross-currency transfer', () =>
        Effect.gen(function* () {
            const operatedAt = new Date(2026, 0, 30, 8, 52, 7);
            const transferMcc = yield* findMccByCode('4829');
            const { sourceAccount, targetAccount } = yield* seedHistoricalBridgeAccounts();
            const existingTransfer = yield* seedTransfer('Приват Сина', operatedAt, sourceAccount.id, targetAccount.id, 10_144_000_000);

            yield* testDb
                .update(TransactionEntryEntityTable)
                .set({ amount: 200_000_000 })
                .where(
                    and(
                        eq(TransactionEntryEntityTable.transactionId, existingTransfer.id),
                        eq(TransactionEntryEntityTable.accountId, sourceAccount.id)
                    )
                );

            const duplicateIncome = yield* seedBankPair.income(
                { externalId: 'privat-income-cross-currency', operatedAt: new Date(operatedAt.getTime() + 60 * 60 * 1000) },
                { accountId: targetAccount.id, amount: 10_144_000_000, mccCategoryId: transferMcc.id }
            );

            yield* expectIncomeDuplicateConsolidated(existingTransfer, duplicateIncome);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('routes an approximate cross-currency Privat income through a canonical over an existing Monobank transfer', () =>
        Effect.gen(function* () {
            const operatedAt = new Date(2026, 0, 28, 18, 17, 48);
            const transferMcc = yield* findMccByCode('4829');
            const eur = yield* seed.instrument({ code: 'EUR', name: 'Euro', symbol: '€' });
            const sourceAccount = yield* seed.account({
                title: 'Monobank Black EUR',
                type: AccountTypeEnum.BANK_SYNC,
                iban: SOURCE_IBAN,
                instrumentId: eur.id
            });
            const oldTargetAccount = yield* seed.account({ title: 'приватбанк UAH', type: AccountTypeEnum.BANK });
            const privatAccount = yield* seed.account({
                title: 'Privatbank',
                type: AccountTypeEnum.BANK_SYNC,
                iban: PRIVAT_IBAN
            });
            const existingTransfer = yield* seedTransfer(
                'приват сина 3',
                operatedAt,
                sourceAccount.id,
                oldTargetAccount.id,
                APPROXIMATE_TRANSFER_TARGET_AMOUNT
            );

            yield* testDb.update(AccountEntityTable).set({ isActive: false }).where(eq(AccountEntityTable.id, oldTargetAccount.id));
            yield* testDb
                .update(TransactionEntityTable)
                .set({
                    exchangeRate: APPROXIMATE_SOURCE_AMOUNT / APPROXIMATE_TRANSFER_TARGET_AMOUNT,
                    externalSource: ExternalSourceEnum.MONOBANK
                })
                .where(eq(TransactionEntityTable.id, existingTransfer.id));
            yield* testDb
                .update(TransactionEntryEntityTable)
                .set({ amount: APPROXIMATE_SOURCE_AMOUNT })
                .where(
                    and(
                        eq(TransactionEntryEntityTable.transactionId, existingTransfer.id),
                        eq(TransactionEntryEntityTable.accountId, sourceAccount.id)
                    )
                );

            const privatIncome = yield* seedBankPair.income(
                { externalId: 'approximate-privat-income', operatedAt: new Date(operatedAt.getTime() + 60 * 60 * 1000 + 1000) },
                { accountId: privatAccount.id, amount: APPROXIMATE_PRIVAT_INCOME_AMOUNT, mccCategoryId: transferMcc.id }
            );

            yield* testDb
                .update(TransactionEntityTable)
                .set({ externalSource: ExternalSourceEnum.PRIVATBANK, title: 'від IHOR YEHOROV' })
                .where(eq(TransactionEntityTable.id, privatIncome.id));

            const canonicalId = yield* expectIncomeDuplicateConsolidated(existingTransfer, privatIncome);

            yield* expectPrivatTargetRouted(canonicalId, privatAccount.id, APPROXIMATE_PRIVAT_INCOME_AMOUNT);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('routes a same-currency Privat income from an inactive manual target account to the synced account', () =>
        Effect.gen(function* () {
            const { existingTransfer, privatAccount, privatIncome } = yield* seedSameCurrencyPrivatArchivedTargetDuplicate();

            const canonicalId = yield* expectIncomeDuplicateConsolidated(existingTransfer, privatIncome);

            yield* expectPrivatTargetRouted(canonicalId, privatAccount.id, UAH_AMOUNT);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('routes a same-currency Privat income from an inactive synced target account to the active synced account', () =>
        Effect.gen(function* () {
            const { existingTransfer, privatAccount, privatIncome } = yield* seedSameCurrencyPrivatArchivedSyncedTargetDuplicate();

            const canonicalId = yield* expectIncomeDuplicateConsolidated(existingTransfer, privatIncome);

            yield* expectPrivatTargetRouted(canonicalId, privatAccount.id, UAH_AMOUNT);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('routes a legacy CSV transfer from a deleted source account to the active synced Privat account', () =>
        Effect.gen(function* () {
            const { existingTransfer, privatAccount, privatIncome, sourceAccount } = yield* seedLegacyCsvDeletedSourcePrivatDuplicate();

            const canonicalId = yield* expectIncomeDuplicateConsolidated(existingTransfer, privatIncome);

            expect((yield* fetchTransactionById(canonicalId)).fromAccountId).toBe(sourceAccount.id);
            yield* expectPrivatTargetRouted(canonicalId, privatAccount.id, UAH_AMOUNT);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not retarget a legacy CSV transfer when the source account is still active', () =>
        Effect.gen(function* () {
            const { existingTransfer, privatIncome, sourceAccount } = yield* seedLegacyCsvDeletedSourcePrivatDuplicate();

            yield* testDb
                .update(AccountEntityTable)
                .set({ deletedAt: null, includeInNetWorth: true, isActive: true })
                .where(eq(AccountEntityTable.id, sourceAccount.id));
            yield* testDb
                .update(TransactionEntryEntityTable)
                .set({ deletedAt: null })
                .where(
                    and(
                        eq(TransactionEntryEntityTable.transactionId, existingTransfer.id),
                        eq(TransactionEntryEntityTable.accountId, sourceAccount.id)
                    )
                );

            const transferConsolidationService = yield* TransferConsolidationService;
            const result = yield* transferConsolidationService.consolidate(null);

            expect(result).toEqual({ found: 0, consolidated: 0 });
            expect((yield* fetchTransactionById(privatIncome.id)).consolidationParentTransactionId).toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('includes inactive manual target consolidation repairs in bank sync repair action', () =>
        Effect.gen(function* () {
            const { existingTransfer, privatAccount, privatIncome } = yield* seedSameCurrencyPrivatArchivedTargetDuplicate();

            const syncRepairService = yield* SyncRepairService;
            const preview = yield* syncRepairService.previewDuplicates();

            expect(preview.duplicateTransactionCount).toBe(1);
            expect(preview.sources).toEqual([
                expect.objectContaining({
                    duplicateTransactionCount: 1,
                    externalSource: ExternalSourceEnum.PRIVATBANK
                })
            ]);

            const result = yield* syncRepairService.removeDuplicates();

            expect(result.repairedTransactionCount).toBe(1);
            yield* expectPrivatTargetRouted(
                yield* expectIncomeDuplicateNested(existingTransfer, privatIncome),
                privatAccount.id,
                UAH_AMOUNT
            );
        }).pipe(Effect.provide(TestLayer))
    );
});
