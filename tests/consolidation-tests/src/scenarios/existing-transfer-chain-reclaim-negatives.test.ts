import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import {
    CHAIN_RECLAIM_BRIDGE_EXCHANGE_RATE,
    CHAIN_RECLAIM_EXCHANGE_RATE,
    CHAIN_RECLAIM_OPERATED_AT,
    CHAIN_RECLAIM_SOURCE_AMOUNT,
    CHAIN_RECLAIM_TARGET_AMOUNT,
    seedChainReclaim
} from '../harness/chain-reclaim-fixture';
import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService } from '../harness/test-context';

const OUTSIDE_FAST_WINDOW_MS = 120_000;
const LONE_INCOME_OFFSET_MS = 11_000;
const HOP_B_INCOME_OFFSET_MS = 5_000;
const HOP_B_EXPENSE_OFFSET_MS = 6_000;
const HOP_C_INCOME_OFFSET_MS = 7_000;
const HOP_C_EXPENSE_OFFSET_MS = 8_000;
const BRIDGE_INCOME_OFFSET_MS = 10_000;
const BRIDGE_EXPENSE_OFFSET_MS = 12_000;

const expectNoReclaim = async (): Promise<void> => {
    const result = await runConsolidation();
    expect(result.groups.existingTransferChainReclaimCandidates).toHaveLength(0);
    expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER)).toHaveLength(0);
};

// eslint-disable-next-line max-lines-per-function -- Integration scenario suite with many negative cases
describe('consolidation/existing-transfer-chain-reclaim-negatives', () => {
    it('does not reclaim when the bridge amounts differ from the transfer target amount', async () => {
        seedChainReclaim({
            bridgeIncomeAmount: CHAIN_RECLAIM_TARGET_AMOUNT + PRECISION,
            bridgeExpenseAmount: CHAIN_RECLAIM_TARGET_AMOUNT + PRECISION
        });

        await expectNoReclaim();
    });

    it('does not reclaim when the bridge income to_iban is not the source account IBAN', async () => {
        seedChainReclaim({ bridgeIncomeToIban: 'UA-WRONG' });

        await expectNoReclaim();
    });

    it('does not reclaim when the bridge expense to_iban is not the target account IBAN', async () => {
        seedChainReclaim({ bridgeExpenseToIban: 'UA-WRONG' });

        await expectNoReclaim();
    });

    it('does not reclaim when the bridge instrument differs from the target instrument', async () => {
        const eurInstrument = testSeedService.instrument({ code: 'EUR', name: 'Euro', symbol: '€' });
        seedChainReclaim({ bridgeInstrumentId: eurInstrument.id });

        await expectNoReclaim();
    });

    it('does not reclaim when the bridge legs fall outside the fast time window', async () => {
        seedChainReclaim({ bridgeOperatedAtOffsetMs: OUTSIDE_FAST_WINDOW_MS });

        await expectNoReclaim();
    });

    it('does not reclaim a lone same-amount income leg without a matching bridge expense', async () => {
        const scenario = seedChainReclaim({ bridgeExpenseToIban: 'UA-WRONG' });
        const transferMcc = testQueryService.findMccByCode('4829');
        testSeedService.bankPairIncome(
            { externalId: 'lone-income', operatedAt: new Date(CHAIN_RECLAIM_OPERATED_AT.getTime() + LONE_INCOME_OFFSET_MS) },
            {
                accountId: scenario.bridgeAccount.id,
                amount: CHAIN_RECLAIM_TARGET_AMOUNT,
                exchangeRate: CHAIN_RECLAIM_BRIDGE_EXCHANGE_RATE,
                toIban: 'UA-SOURCE',
                mccCategoryId: transferMcc.id
            }
        );

        await expectNoReclaim();
    });

    it('does not reclaim across a three-hop chain where the bridge legs sit on different accounts', async () => {
        const usdInstrument = testSeedService.instrument({ code: 'USD', name: 'Dollar', symbol: '$' });
        const accountA = testSeedService.bankSyncAccount('A USD', null, 'UA-A', usdInstrument.id);
        const accountB = testSeedService.bankSyncAccount('B UAH', null, 'UA-B', 1);
        const accountC = testSeedService.bankSyncAccount('C UAH', null, 'UA-C', 1);
        const accountD = testSeedService.bankSyncAccount('D UAH', null, 'UA-D', 1);

        testSeedService.directTransfer({
            fromAccountId: accountA.id,
            toAccountId: accountD.id,
            fromAmount: CHAIN_RECLAIM_SOURCE_AMOUNT,
            toAmount: CHAIN_RECLAIM_TARGET_AMOUNT,
            operatedAt: CHAIN_RECLAIM_OPERATED_AT,
            exchangeRate: CHAIN_RECLAIM_EXCHANGE_RATE,
            fromEntryExchangeRate: CHAIN_RECLAIM_EXCHANGE_RATE,
            toEntryExchangeRate: 1,
            fromEntryToIban: 'UA-D',
            withBackingSources: true
        });
        testSeedService.bankPairIncome(
            { externalId: 'hop-b-income', operatedAt: new Date(CHAIN_RECLAIM_OPERATED_AT.getTime() + HOP_B_INCOME_OFFSET_MS) },
            {
                accountId: accountB.id,
                amount: CHAIN_RECLAIM_TARGET_AMOUNT,
                exchangeRate: CHAIN_RECLAIM_BRIDGE_EXCHANGE_RATE,
                toIban: 'UA-A'
            }
        );
        testSeedService.bankPairExpense(
            { externalId: 'hop-b-expense', operatedAt: new Date(CHAIN_RECLAIM_OPERATED_AT.getTime() + HOP_B_EXPENSE_OFFSET_MS) },
            { accountId: accountB.id, amount: CHAIN_RECLAIM_TARGET_AMOUNT, exchangeRate: 1, toIban: 'UA-C' }
        );
        testSeedService.bankPairIncome(
            { externalId: 'hop-c-income', operatedAt: new Date(CHAIN_RECLAIM_OPERATED_AT.getTime() + HOP_C_INCOME_OFFSET_MS) },
            { accountId: accountC.id, amount: CHAIN_RECLAIM_TARGET_AMOUNT, exchangeRate: 1, toIban: 'UA-B' }
        );
        testSeedService.bankPairExpense(
            { externalId: 'hop-c-expense', operatedAt: new Date(CHAIN_RECLAIM_OPERATED_AT.getTime() + HOP_C_EXPENSE_OFFSET_MS) },
            { accountId: accountC.id, amount: CHAIN_RECLAIM_TARGET_AMOUNT, exchangeRate: 1, toIban: 'UA-D' }
        );

        await expectNoReclaim();
    });

    it('does not reclaim when a bridge leg carries a fee entry', async () => {
        const scenario = seedChainReclaim();
        testSeedService.feeEntry(scenario.bridgeIncome.id, scenario.bridgeAccount.id, 5 * PRECISION, 'bridge-income-fee');

        await expectNoReclaim();
    });

    it('does not reclaim a bare hand-created direct transfer with no consolidation type', async () => {
        const usdInstrument = testSeedService.instrument({ code: 'USD', name: 'Dollar', symbol: '$' });
        const sourceAccount = testSeedService.bankSyncAccount('Source USD', null, 'UA-SOURCE', usdInstrument.id);
        const bridgeAccount = testSeedService.bankSyncAccount('Bridge UAH', null, 'UA-BRIDGE', 1);
        const targetAccount = testSeedService.bankSyncAccount('Target UAH', null, 'UA-TARGET', 1);

        testSeedService.directTransfer({
            fromAccountId: sourceAccount.id,
            toAccountId: targetAccount.id,
            fromAmount: CHAIN_RECLAIM_SOURCE_AMOUNT,
            toAmount: CHAIN_RECLAIM_TARGET_AMOUNT,
            operatedAt: CHAIN_RECLAIM_OPERATED_AT,
            exchangeRate: CHAIN_RECLAIM_EXCHANGE_RATE,
            fromEntryExchangeRate: CHAIN_RECLAIM_EXCHANGE_RATE,
            toEntryExchangeRate: 1,
            fromEntryToIban: 'UA-TARGET',
            consolidationType: null
        });
        testSeedService.bankPairIncome(
            { externalId: 'bridge-income', operatedAt: new Date(CHAIN_RECLAIM_OPERATED_AT.getTime() + BRIDGE_INCOME_OFFSET_MS) },
            {
                accountId: bridgeAccount.id,
                amount: CHAIN_RECLAIM_TARGET_AMOUNT,
                exchangeRate: CHAIN_RECLAIM_BRIDGE_EXCHANGE_RATE,
                toIban: 'UA-SOURCE'
            }
        );
        testSeedService.bankPairExpense(
            { externalId: 'bridge-expense', operatedAt: new Date(CHAIN_RECLAIM_OPERATED_AT.getTime() + BRIDGE_EXPENSE_OFFSET_MS) },
            { accountId: bridgeAccount.id, amount: CHAIN_RECLAIM_TARGET_AMOUNT, exchangeRate: 1, toIban: 'UA-TARGET' }
        );

        await expectNoReclaim();
    });
});
