import { AccountTypeEnum, PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { BRIDGE_THEFT_FX_OPERATED_AT, expectFxPairCanonicalChildren, seedBridgeTheftFixture } from '../harness/bridge-theft-fixture';
import { IBAN_BRIDGE_TRANSFER_MCC } from '../harness/iban-bridge-topology';
import { expectSecondConsolidationRunStable, runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const SAME_CURRENCY_AMOUNT = 5_000 * PRECISION;
const THIRD_PARTY_IBAN = 'UA-THIRD-PARTY-IBAN';
const FROM_ACCOUNT_IBAN = 'UA-FROM-IBAN';

const seedSameCurrencyPairFixture = (incomeToIban: string | null) =>
    Effect.gen(function* () {
        const transferMccId = (yield* testQueryService.findMccByCode(IBAN_BRIDGE_TRANSFER_MCC)).id;
        const fromAccount = yield* testSeedService.account({ title: 'From UAH', type: AccountTypeEnum.BANK_SYNC, iban: FROM_ACCOUNT_IBAN });
        const toAccount = yield* testSeedService.account({ title: 'To UAH', type: AccountTypeEnum.BANK_SYNC });
        const income = yield* testSeedService.bankPairIncome(
            { externalId: `pair-income-${incomeToIban ?? 'none'}`, operatedAt: BRIDGE_THEFT_FX_OPERATED_AT },
            { accountId: toAccount.id, amount: SAME_CURRENCY_AMOUNT, mccCategoryId: transferMccId, toIban: incomeToIban }
        );
        yield* testSeedService.bankPairExpense(
            { externalId: `pair-expense-${incomeToIban ?? 'none'}`, operatedAt: new Date(BRIDGE_THEFT_FX_OPERATED_AT.getTime() + 5_000) },
            { accountId: fromAccount.id, amount: SAME_CURRENCY_AMOUNT, mccCategoryId: transferMccId }
        );

        return { fromAccountId: fromAccount.id, incomeTransactionId: income.id, toAccountId: toAccount.id };
    });

const fetchConsolidationParentId = (transactionId: number) =>
    Effect.gen(function* () {
        return (yield* testQueryService.findTransactionById(transactionId))?.consolidationParentTransactionId ?? null;
    });

const fetchSingleTransferPairCanonical = () =>
    Effect.gen(function* () {
        const [canonical] = yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);

        if (canonical === undefined) {
            throw new Error('Expected a single TRANSFER_PAIR canonical');
        }

        return canonical.id;
    });

layer(TestLayer)('consolidation/transfer-pair-bridge-claim-veto', it => {
    it.effect('does not pair a same-currency interbank expense with a foreign-currency bridge income by title declaration', () =>
        Effect.gen(function* () {
            const { fxExpense, fxBridgeIncome, interbankExpense, sourceEurAccountId, bridgeUahAccountId } = yield* seedBridgeTheftFixture();

            const result = yield* runConsolidation();

            expect(result.consolidated).toBe(1);
            const canonicalId = yield* fetchSingleTransferPairCanonical();
            yield* expectFxPairCanonicalChildren(canonicalId, {
                fxExpenseId: fxExpense.id,
                fxBridgeIncomeId: fxBridgeIncome.id,
                interbankExpenseId: interbankExpense.id
            });
            const canonical = yield* testQueryService.fetchTransactionById(canonicalId);
            expect(canonical.fromAccountId).toBe(sourceEurAccountId);
            expect(canonical.toAccountId).toBe(bridgeUahAccountId);
            expect(yield* fetchConsolidationParentId(interbankExpense.id)).toBeNull();
        })
    );

    it.effect('does not pair a same-currency expense with an income whose declared source iban belongs to a third account', () =>
        Effect.gen(function* () {
            const fixture = yield* seedSameCurrencyPairFixture(THIRD_PARTY_IBAN);

            const result = yield* runConsolidation();

            expect(result.consolidated).toBe(0);
            expect(yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(0);
            expect(yield* fetchConsolidationParentId(fixture.incomeTransactionId)).toBeNull();
        })
    );

    it.effect('still pairs a same-currency expense with an income whose declared source iban matches the expense account', () =>
        Effect.gen(function* () {
            const fixture = yield* seedSameCurrencyPairFixture(FROM_ACCOUNT_IBAN);

            const result = yield* runConsolidation();

            expect(result.consolidated).toBe(1);
            const canonicalId = yield* fetchSingleTransferPairCanonical();
            const childIds = yield* testQueryService.fetchChildTransactionIds(canonicalId);
            expect(childIds).toHaveLength(2);
            const canonical = yield* testQueryService.fetchTransactionById(canonicalId);
            expect(canonical.fromAccountId).toBe(fixture.fromAccountId);
            expect(canonical.toAccountId).toBe(fixture.toAccountId);
            expect(yield* fetchConsolidationParentId(fixture.incomeTransactionId)).toBe(canonicalId);
        })
    );

    it.effect('keeps results stable when consolidation runs twice', () =>
        Effect.gen(function* () {
            const { fxExpense, fxBridgeIncome, interbankExpense } = yield* seedBridgeTheftFixture();

            yield* runConsolidation();
            yield* expectSecondConsolidationRunStable();
            const canonicals = yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
            expect(canonicals).toHaveLength(1);
            yield* expectFxPairCanonicalChildren(canonicals[0].id, {
                fxExpenseId: fxExpense.id,
                fxBridgeIncomeId: fxBridgeIncome.id,
                interbankExpenseId: interbankExpense.id
            });
        })
    );
});
