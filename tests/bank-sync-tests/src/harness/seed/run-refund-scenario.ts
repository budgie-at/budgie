import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

import { seed } from './seed';
import { seedRefundedExpense } from './seed-refund-fixture';

import type { ConsolidationResultInterface } from '@app/sync/interface/consolidation-result.interface';

type RunRefundScenarioInput = Omit<Parameters<typeof seedRefundedExpense>[0], 'accountId'>;

interface RunRefundScenarioResult {
    readonly account: ReturnType<typeof seed.account>;
    readonly expense: ReturnType<typeof seedRefundedExpense>['expense'];
    readonly refunds: ReturnType<typeof seedRefundedExpense>['refunds'];
    readonly result: ConsolidationResultInterface;
}

export const runRefundScenario = async (input: RunRefundScenarioInput): Promise<RunRefundScenarioResult> => {
    const account = seed.account({ externalId: 'mono-card' });
    const { expense, refunds } = seedRefundedExpense({ ...input, accountId: account.id });
    const result: ConsolidationResultInterface = await transferConsolidationService.consolidate();

    return { account, expense, refunds, result };
};
