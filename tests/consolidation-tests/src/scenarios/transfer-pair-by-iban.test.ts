import { ExternalSourceEnum, PRECISION, TransactionConsolidationTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService, runEffect } from '../harness/test-context';

const EUR_IBAN = 'UA-FOP-EUR';
const UAH_IBAN = 'UA-FOP-UAH';
const CONVERSION_OPERATED_AT = new Date(2026, 7, 5, 9, 0, 0);

const seedSameBankIbanConversion = (incomeDelayMs: number) => {
    const transferMcc = testQueryService.findMccByCode('4829');
    const eur = testSeedService.instrument({ code: 'EUR', name: 'Euro', symbol: '€' });
    const eurAccount = testSeedService.bankSyncAccount('Monobank Fop EUR', ExternalSourceEnum.MONOBANK, EUR_IBAN, eur.id);
    const uahAccount = testSeedService.bankSyncAccount('Monobank Fop UAH', ExternalSourceEnum.MONOBANK, UAH_IBAN);
    const expense = testSeedService.bankPairExpense(
        { externalId: 'fop-eur-conversion', operatedAt: CONVERSION_OPERATED_AT },
        { accountId: eurAccount.id, amount: 9.77 * PRECISION, exchangeRate: 0.01954, mccCategoryId: transferMcc.id, toIban: UAH_IBAN }
    );
    const income = testSeedService.bankPairIncome(
        { externalId: 'fop-uah-conversion', operatedAt: new Date(CONVERSION_OPERATED_AT.getTime() + incomeDelayMs) },
        { accountId: uahAccount.id, amount: 500 * PRECISION, mccCategoryId: transferMcc.id, toIban: EUR_IBAN }
    );

    return { eurAccount, expense, income, uahAccount };
};

describe('consolidation/transfer-pair-by-iban', () => {
    it('promotes matching expense and income counter-IBAN rows into a canonical transfer', async () => {
        const transferMcc = testQueryService.findMccByCode('4829');
        const { fromAccount, toAccount } = testSeedService.accountPair('UA-FROM', 'UA-TO');
        const operatedAt = new Date(2026, 0, 15, 12, 0, 0);
        const expense = testSeedService.bankPairExpense(
            { externalId: 'iban-expense', operatedAt },
            { accountId: fromAccount.id, amount: 250 * PRECISION, mccCategoryId: transferMcc.id, toIban: 'UA-TO' }
        );
        const income = testSeedService.bankPairIncome(
            { externalId: 'iban-income', operatedAt: new Date(operatedAt.getTime() + 5_000) },
            { accountId: toAccount.id, amount: 250 * PRECISION, mccCategoryId: transferMcc.id }
        );
        const tag = testSeedService.tag('Transfer Source');
        testSeedService.transactionTag(expense.id, tag.id);
        testSeedService.transactionTag(income.id, tag.id);

        const result = await runEffect(runConsolidation());
        expect(result.consolidated).toBe(1);

        const canonicals = testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
        expect(canonicals).toHaveLength(1);
        expect(canonicals[0].type).toBe(TransactionTypeEnum.TRANSFER);
        expect(canonicals[0].fromAccountId).toBe(fromAccount.id);
        expect(canonicals[0].toAccountId).toBe(toAccount.id);

        expect(testQueryService.fetchTransactionById(expense.id).consolidationParentTransactionId).toBe(canonicals[0].id);
        expect(testQueryService.fetchTransactionById(income.id).consolidationParentTransactionId).toBe(canonicals[0].id);

        const movedEntries = testQueryService.fetchEntriesByTransactionId(canonicals[0].id);
        const sourceIds = movedEntries.flatMap(entry => (isDefined(entry.originalTransactionId) ? [entry.originalTransactionId] : []));
        expect(sourceIds.sort()).toEqual([expense.id, income.id].sort());
        expect(testQueryService.fetchTransactionTagIds(canonicals[0].id)).toHaveLength(0);
    });

    it('pairs a same-second same-bank currency conversion whose counter-IBAN matches', async () => {
        const { eurAccount, expense, income, uahAccount } = seedSameBankIbanConversion(0);

        expect((await runEffect(runConsolidation())).consolidated).toBe(1);
        const [canonical] = testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
        expect(canonical.fromAccountId).toBe(eurAccount.id);
        expect(canonical.toAccountId).toBe(uahAccount.id);
        expect(testQueryService.fetchTransactionById(expense.id).consolidationParentTransactionId).toBe(canonical.id);
        expect(testQueryService.fetchTransactionById(income.id).consolidationParentTransactionId).toBe(canonical.id);
    });

    it('keeps a counter-IBAN currency conversion unpaired when the legs are minutes apart', async () => {
        const { expense, income } = seedSameBankIbanConversion(5 * 60_000);

        expect(await runEffect(runConsolidation())).toEqual({ consolidated: 0, found: 0 });
        expect(testQueryService.fetchTransactionById(expense.id).consolidationParentTransactionId).toBeNull();
        expect(testQueryService.fetchTransactionById(income.id).consolidationParentTransactionId).toBeNull();
    });
});
