import {
    AccountBalanceRepository,
    AccountTypeEnum,
    SyncEntityTable,
    SyncModeEnum,
    TagSourceEnum,
    TransactionConsolidationTypeEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionTypeEnum,
    TransactionUpdatedByEnum
} from '@budgie/contracts';
import { eq, inArray } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { seed, seedBankPair, testDb } from '../../harness';

import {
    ADJUSTMENT_CREATED_AT,
    BALANCE_UPDATED_AT,
    DUPLICATE_CREATED_AT,
    DUPLICATE_OPERATED_AT,
    SOURCE_AMOUNT,
    TARGET_AMOUNT
} from './data-migration-money-impact.constant';

import type {
    AttachIbanBridgeOriginalsInputInterface,
    AttachTransferPairOriginalsInputInterface,
    ParentOriginalsInputInterface,
    SeedCanonicalTransferInputInterface,
    SeedCompetingTransferPairCanonicalInputInterface,
    SeedDuplicateCanonicalPairInputInterface,
    UpsertRepairStoredBalancesInputInterface
} from './duplicate-transfer-repair-fixture.interface';

export const stampTransactions = (transactionIds: readonly number[], createdAt: number) =>
    Effect.all(
        [
            testDb
                .update(TransactionEntityTable)
                .set({ createdAt: new Date(createdAt * 1000), updatedAt: new Date(createdAt * 1000) })
                .where(inArray(TransactionEntityTable.id, [...transactionIds])),
            testDb
                .update(TransactionEntryEntityTable)
                .set({ createdAt: new Date(createdAt * 1000), updatedAt: new Date(createdAt * 1000) })
                .where(inArray(TransactionEntryEntityTable.transactionId, [...transactionIds]))
        ],
        { discard: true }
    );

const parentOriginalsToCanonical = Effect.fnUntraced(function* (input: ParentOriginalsInputInterface) {
    yield* stampTransactions(input.originalTransactionIds, input.createdAt);
    yield* testDb
        .update(TransactionEntityTable)
        .set({ consolidationParentTransactionId: input.canonicalTransactionId })
        .where(inArray(TransactionEntityTable.id, [...input.originalTransactionIds]));

    yield* Effect.forEach(
        input.originalTransactionIds,
        originalTransactionId =>
            testDb
                .update(TransactionEntryEntityTable)
                .set({ transactionId: input.canonicalTransactionId, originalTransactionId })
                .where(eq(TransactionEntryEntityTable.transactionId, originalTransactionId)),
        { discard: true }
    );
});

const seedBalanceAdjustment = Effect.fnUntraced(function* (accountId: number, createdAt: number) {
    const transactionRows = yield* testDb
        .insert(TransactionEntityTable)
        .values({
            type: TransactionTypeEnum.ADJUSTMENT,
            title: 'Balance calibration',
            externalId: null,
            externalSource: null,
            operatedAt: new Date((createdAt - 60) * 1000),
            exchangeRate: 1,
            fromAccountId: null,
            toAccountId: accountId,
            comment: '',
            updatedBy: null,
            createdAt: new Date(createdAt * 1000),
            updatedAt: new Date(createdAt * 1000)
        })
        .returning({ id: TransactionEntityTable.id });
    const sync = yield* seed.sync({ accountId, mode: SyncModeEnum.FORWARD });

    yield* testDb
        .update(SyncEntityTable)
        .set({ balanceAdjustmentTransactionId: transactionRows[0].id })
        .where(eq(SyncEntityTable.id, sync.id));
});

const attachTransferPairOriginals = Effect.fnUntraced(function* (input: AttachTransferPairOriginalsInputInterface) {
    const expense = yield* seedBankPair.expense(
        { externalId: `repair-expense-${input.suffix}`, operatedAt: DUPLICATE_OPERATED_AT },
        { accountId: input.sourceAccountId, amount: input.sourceAmount, toIban: input.bridgeIban }
    );
    const income = yield* seedBankPair.income(
        { externalId: `repair-income-${input.suffix}`, operatedAt: DUPLICATE_OPERATED_AT },
        { accountId: input.targetAccountId, amount: input.targetAmount }
    );

    yield* parentOriginalsToCanonical({
        canonicalTransactionId: input.canonicalTransactionId,
        originalTransactionIds: [expense.id, income.id],
        createdAt: input.createdAt
    });

    return { expense, income };
});

const attachIbanBridgeOriginals = Effect.fnUntraced(function* (input: AttachIbanBridgeOriginalsInputInterface) {
    const income = yield* seedBankPair.income(
        { externalId: `repair-bridge-income-${input.suffix}`, operatedAt: DUPLICATE_OPERATED_AT },
        {
            accountId: input.bridgeAccountId,
            amount: input.targetAmount,
            exchangeRate: input.targetAmount / input.sourceAmount,
            toIban: input.sourceIban
        }
    );
    const expense = yield* seedBankPair.expense(
        { externalId: `repair-bridge-expense-${input.suffix}`, operatedAt: DUPLICATE_OPERATED_AT },
        { accountId: input.bridgeAccountId, amount: input.targetAmount, toIban: input.targetIban }
    );

    yield* parentOriginalsToCanonical({
        canonicalTransactionId: input.canonicalTransactionId,
        originalTransactionIds: [income.id, expense.id],
        createdAt: input.createdAt
    });

    return { expense, income };
});

const seedCanonicalTransfer = Effect.fnUntraced(function* (input: SeedCanonicalTransferInputInterface) {
    const canonical = yield* seed.directTransfer({
        consolidationType: input.consolidationType,
        exchangeRate: input.targetAmount / input.sourceAmount,
        operatedAt: DUPLICATE_OPERATED_AT,
        sourceAccountId: input.sourceAccountId,
        sourceAmount: input.sourceAmount,
        sourceEntryExchangeRate: 1,
        targetAccountId: input.targetAccountId,
        targetAmount: input.targetAmount,
        toIban: null
    });
    const originals =
        input.consolidationType === TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER
            ? yield* attachIbanBridgeOriginals({ ...input, canonicalTransactionId: canonical.id })
            : yield* attachTransferPairOriginals({ ...input, canonicalTransactionId: canonical.id });

    yield* stampTransactions([canonical.id], input.createdAt);

    return { canonical, originals };
});

export const seedDuplicateCanonicalPair = Effect.fnUntraced(function* (input: SeedDuplicateCanonicalPairInputInterface) {
    const sourceAmount = input.sourceAmount ?? SOURCE_AMOUNT;
    const targetAmount = input.targetAmount ?? TARGET_AMOUNT;
    const createdAt = input.createdAt ?? DUPLICATE_CREATED_AT;
    const bridge = yield* seedCanonicalTransfer({
        ...input,
        consolidationType: TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER,
        sourceAmount,
        targetAmount,
        suffix: `bridge-${input.amountSuffix}`,
        createdAt
    });
    const pair = yield* seedCanonicalTransfer({
        ...input,
        consolidationType: TransactionConsolidationTypeEnum.TRANSFER_PAIR,
        sourceAmount,
        targetAmount,
        suffix: `pair-${input.amountSuffix}`,
        createdAt
    });

    return { bridge, pair };
});

const seedRepairAccounts = Effect.fnUntraced(function* (fixtureName: string) {
    const sourceIban = `UA-${fixtureName.toUpperCase()}-SOURCE`;
    const targetIban = `UA-${fixtureName.toUpperCase()}-TARGET`;
    const bridgeIban = `UA-${fixtureName.toUpperCase()}-BRIDGE`;
    const sourceAccount = yield* seed.account({
        externalId: `${fixtureName}-source`,
        type: AccountTypeEnum.BANK_SYNC,
        instrumentId: 1,
        iban: sourceIban
    });
    const targetAccount = yield* seed.account({
        externalId: `${fixtureName}-target`,
        type: AccountTypeEnum.BANK_SYNC,
        instrumentId: 1,
        iban: targetIban
    });
    const bridgeAccount = yield* seed.account({
        externalId: `${fixtureName}-bridge`,
        type: AccountTypeEnum.BANK_SYNC,
        instrumentId: 1,
        iban: bridgeIban
    });

    yield* seedBalanceAdjustment(sourceAccount.id, ADJUSTMENT_CREATED_AT);
    yield* seedBalanceAdjustment(targetAccount.id, ADJUSTMENT_CREATED_AT);

    return { sourceIban, targetIban, bridgeIban, sourceAccount, targetAccount, bridgeAccount };
});

export const seedAdjustedDuplicatePair = Effect.fnUntraced(function* (
    fixtureName: string,
    amountSuffix: string,
    createdAt: number = DUPLICATE_CREATED_AT
) {
    const accounts = yield* seedRepairAccounts(fixtureName);
    const duplicate = yield* seedDuplicateCanonicalPair({
        sourceAccountId: accounts.sourceAccount.id,
        targetAccountId: accounts.targetAccount.id,
        bridgeAccountId: accounts.bridgeAccount.id,
        sourceIban: accounts.sourceIban,
        targetIban: accounts.targetIban,
        bridgeIban: accounts.bridgeIban,
        amountSuffix,
        createdAt
    });

    return { ...accounts, duplicate };
});

export const seedCompetingTransferPairCanonical = (input: SeedCompetingTransferPairCanonicalInputInterface) =>
    seedCanonicalTransfer({
        ...input,
        consolidationType: TransactionConsolidationTypeEnum.TRANSFER_PAIR,
        sourceAmount: SOURCE_AMOUNT,
        targetAmount: TARGET_AMOUNT,
        createdAt: DUPLICATE_CREATED_AT
    });

export const upsertRepairStoredBalances = Effect.fnUntraced(function* (input: UpsertRepairStoredBalancesInputInterface) {
    const accountBalanceRepository = yield* AccountBalanceRepository;

    yield* accountBalanceRepository.upsert({ accountId: input.sourceAccountId, amount: input.sourceAmount });
    yield* accountBalanceRepository.upsert({ accountId: input.targetAccountId, amount: input.targetAmount });
    yield* testDb.$client.unsafe(
        `UPDATE account_balances SET updated_at = ${input.updatedAt ?? BALANCE_UPDATED_AT} WHERE account_id IN (${input.sourceAccountId}, ${input.targetAccountId})`
    );
});

export const prepareDuplicateTransferRepairFixture = Effect.fnUntraced(function* () {
    const fixture = yield* seedAdjustedDuplicatePair('repair', 'affected');
    const hiddenTag = yield* seed.tag('Hidden transfer metadata');

    yield* seed.transactionTag(fixture.duplicate.pair.canonical.id, hiddenTag.id, TagSourceEnum.USER);
    yield* upsertRepairStoredBalances({
        sourceAccountId: fixture.sourceAccount.id,
        targetAccountId: fixture.targetAccount.id,
        sourceAmount: -2 * SOURCE_AMOUNT,
        targetAmount: 2 * TARGET_AMOUNT
    });

    return { ...fixture, hiddenTag };
});

export const markTransactionUpdatedByUser = (transactionId: number) =>
    testDb
        .update(TransactionEntityTable)
        .set({ updatedBy: TransactionUpdatedByEnum.USER })
        .where(eq(TransactionEntityTable.id, transactionId));
