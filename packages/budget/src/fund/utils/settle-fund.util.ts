import { addMonths } from 'date-fns/addMonths';

import { isDefined } from '@rnw-community/shared';

import { matchFundSpend } from './match-fund-spend.util';

import type { BudgetSpentLedgerEntryInterface } from '../../spent/interface/budget-spent-ledger-entry.interface';
import type { BudgetFundSettleSourceInterface } from '../interface/budget-fund-settle-source.interface';
import type { BudgetFundSettlementInterface } from '../interface/budget-fund-settlement.interface';

export const settleFund = (
    fund: BudgetFundSettleSourceInterface,
    dueWindowEntries: readonly Pick<BudgetSpentLedgerEntryInterface, 'entryId' | 'categoryId' | 'amount' | 'operatedAt'>[]
): BudgetFundSettlementInterface => {
    const drawn = matchFundSpend(dueWindowEntries, [fund]).reduce((total, draw) => total + draw.amount, 0);
    const fundedAmount = Math.max(fund.fundedAmount - drawn, 0);

    if (isDefined(fund.repeatEveryMonths)) {
        return { fundedAmount, dueAt: addMonths(fund.dueAt, fund.repeatEveryMonths), isFinished: false };
    }

    return { fundedAmount, dueAt: fund.dueAt, isFinished: true };
};
