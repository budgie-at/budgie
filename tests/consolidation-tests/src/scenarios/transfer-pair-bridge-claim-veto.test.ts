import { AccountTypeEnum, ExternalSourceEnum, PRECISION, TransactionConsolidationTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { ExchangeRateEntityTable, InstrumentTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { IBAN_BRIDGE_TRANSFER_MCC } from '../harness/iban-bridge-topology';
import { expectSecondConsolidationRunStable, runConsolidation } from '../harness/run-consolidation';
import { testDb, testQueryService, testSeedService } from '../harness/test-context';

import type { TransactionEntityInterface } from '@budgie/contracts';

const FX_EUR_AMOUNT = 620.34 * PRECISION;
const FX_UAH_AMOUNT = 29_900 * PRECISION;
const SAME_CURRENCY_AMOUNT = 5_000 * PRECISION;
const FX_OPERATED_AT = new Date('2025-10-15T13:49:56');
const THIRD_PARTY_IBAN = 'UA-THIRD-PARTY-IBAN';
const FROM_ACCOUNT_IBAN = 'UA-FROM-IBAN';
const FX_BRIDGE_INCOME_TITLE = 'З єврового рахунку ФОП для переказу на картку';

interface TheftFixtureInterface {
    readonly fxExpense: TransactionEntityInterface;
    readonly fxBridgeIncome: TransactionEntityInterface;
    readonly interbankExpense: TransactionEntityInterface;
    readonly bridgeUahAccountId: number;
    readonly sourceEurAccountId: number;
}

const seedVetoInstruments = (): { readonly eurInstrumentId: number; readonly uahInstrumentId: number } => {
    const uah = testSeedService.instrument({ code: 'UAH', name: 'Hryvnia', symbol: '₴', type: InstrumentTypeEnum.FIAT });
    const eur = testSeedService.instrument({ code: 'EUR', name: 'Euro', symbol: '€', type: InstrumentTypeEnum.FIAT });
    testDb
        .insert(ExchangeRateEntityTable)
        .values({ baseInstrumentId: eur.id, quoteInstrumentId: uah.id, rate: 51.62, source: 'test' })
        .run();

    return { eurInstrumentId: eur.id, uahInstrumentId: uah.id };
};

const seedTheftFixture = (): TheftFixtureInterface => {
    const { eurInstrumentId, uahInstrumentId } = seedVetoInstruments();
    const transferMccId = testQueryService.findMccByCode(IBAN_BRIDGE_TRANSFER_MCC).id;
    const sourceEurAccount = testSeedService.bankSyncAccount('Fop EUR', ExternalSourceEnum.MONOBANK, null, eurInstrumentId);
    const bridgeUahAccount = testSeedService.bankSyncAccount('Fop UAH', ExternalSourceEnum.MONOBANK, null, uahInstrumentId);
    const blackUahAccount = testSeedService.bankSyncAccount('Black UAH', ExternalSourceEnum.MONOBANK, null, uahInstrumentId);
    const fxExpense = testSeedService.bankPairExpense(
        { externalId: 'fx-expense', operatedAt: FX_OPERATED_AT },
        { accountId: sourceEurAccount.id, amount: FX_EUR_AMOUNT }
    );
    testSeedService.updateTransaction(fxExpense.id, { title: 'На гривневий рахунок ФОП для переказу на картку' });
    const fxBridgeIncome = testSeedService.bankPairIncome(
        { externalId: 'fx-income', operatedAt: new Date(FX_OPERATED_AT.getTime() + 1_000) },
        { accountId: bridgeUahAccount.id, amount: FX_UAH_AMOUNT }
    );
    testSeedService.updateTransaction(fxBridgeIncome.id, { title: FX_BRIDGE_INCOME_TITLE });
    const interbankExpense = testSeedService.bankPairExpense(
        { externalId: 'interbank-expense', operatedAt: new Date(FX_OPERATED_AT.getTime() + 131_000) },
        { accountId: blackUahAccount.id, amount: FX_UAH_AMOUNT, mccCategoryId: transferMccId }
    );
    testSeedService.updateTransaction(interbankExpense.id, { title: 'приват сина 3' });

    return {
        bridgeUahAccountId: bridgeUahAccount.id,
        fxBridgeIncome,
        fxExpense,
        interbankExpense,
        sourceEurAccountId: sourceEurAccount.id
    };
};

const seedSameCurrencyPairFixture = (
    incomeToIban: string | null
): { readonly income: TransactionEntityInterface; readonly fromAccountId: number; readonly toAccountId: number } => {
    const transferMccId = testQueryService.findMccByCode(IBAN_BRIDGE_TRANSFER_MCC).id;
    const fromAccount = testSeedService.account({ title: 'From UAH', type: AccountTypeEnum.BANK_SYNC, iban: FROM_ACCOUNT_IBAN });
    const toAccount = testSeedService.account({ title: 'To UAH', type: AccountTypeEnum.BANK_SYNC });
    const income = testSeedService.bankPairIncome(
        { externalId: `pair-income-${incomeToIban ?? 'none'}`, operatedAt: FX_OPERATED_AT },
        { accountId: toAccount.id, amount: SAME_CURRENCY_AMOUNT, mccCategoryId: transferMccId, toIban: incomeToIban }
    );
    testSeedService.bankPairExpense(
        { externalId: `pair-expense-${incomeToIban ?? 'none'}`, operatedAt: new Date(FX_OPERATED_AT.getTime() + 5_000) },
        { accountId: fromAccount.id, amount: SAME_CURRENCY_AMOUNT, mccCategoryId: transferMccId }
    );

    return { fromAccountId: fromAccount.id, income, toAccountId: toAccount.id };
};

const fetchConsolidationParentId = (transactionId: number): number | null =>
    testQueryService.findTransactionById(transactionId)?.consolidationParentTransactionId ?? null;

const fetchSingleTransferPairCanonical = (): number => {
    const [canonical] = testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);

    if (canonical === undefined) {
        throw new Error('Expected a single TRANSFER_PAIR canonical');
    }

    return canonical.id;
};

describe('consolidation/transfer-pair-bridge-claim-veto', () => {
    it('does not pair a same-currency interbank expense with a foreign-currency bridge income by title declaration', async () => {
        const fixture = seedTheftFixture();

        const result = await runConsolidation();

        expect(result.consolidated).toBe(1);
        const canonicalId = fetchSingleTransferPairCanonical();
        const childIds = testQueryService.fetchChildTransactionIds(canonicalId);
        expect(childIds).toContain(fixture.fxExpense.id);
        expect(childIds).toContain(fixture.fxBridgeIncome.id);
        expect(childIds).not.toContain(fixture.interbankExpense.id);
        const canonical = testQueryService.fetchTransactionById(canonicalId);
        expect(canonical.fromAccountId).toBe(fixture.sourceEurAccountId);
        expect(canonical.toAccountId).toBe(fixture.bridgeUahAccountId);
        expect(fetchConsolidationParentId(fixture.interbankExpense.id)).toBeNull();
    });

    it('does not pair a same-currency expense with an income whose declared source iban belongs to a third account', async () => {
        const fixture = seedSameCurrencyPairFixture(THIRD_PARTY_IBAN);

        const result = await runConsolidation();

        expect(result.consolidated).toBe(0);
        expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(0);
        expect(fetchConsolidationParentId(fixture.income.id)).toBeNull();
    });

    it('still pairs a same-currency expense with an income whose declared source iban matches the expense account', async () => {
        const fixture = seedSameCurrencyPairFixture(FROM_ACCOUNT_IBAN);

        const result = await runConsolidation();

        expect(result.consolidated).toBe(1);
        const canonicalId = fetchSingleTransferPairCanonical();
        const childIds = testQueryService.fetchChildTransactionIds(canonicalId);
        expect(childIds).toHaveLength(2);
        const canonical = testQueryService.fetchTransactionById(canonicalId);
        expect(canonical.type).toBe(TransactionTypeEnum.TRANSFER);
        expect(canonical.fromAccountId).toBe(fixture.fromAccountId);
        expect(canonical.toAccountId).toBe(fixture.toAccountId);
        expect(fetchConsolidationParentId(fixture.income.id)).toBe(canonicalId);
    });

    it('keeps results stable when consolidation runs twice', async () => {
        const fixture = seedTheftFixture();

        await runConsolidation();
        await expectSecondConsolidationRunStable();
        const canonicals = testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
        expect(canonicals).toHaveLength(1);
        const childIds = testQueryService.fetchChildTransactionIds(canonicals[0].id);
        expect(childIds).toContain(fixture.fxExpense.id);
        expect(childIds).toContain(fixture.fxBridgeIncome.id);
        expect(childIds).not.toContain(fixture.interbankExpense.id);
    });
});
