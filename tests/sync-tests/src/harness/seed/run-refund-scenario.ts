import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import * as Effect from 'effect/Effect';

import { seed } from './seed';
import { seedRefundedExpense } from './seed-refund-fixture';

import type { ConsolidationResultInterface } from '@budgie/consolidation';

type RunRefundScenarioInput = Omit<Parameters<typeof seedRefundedExpense>[0], 'accountId'>;

interface RunRefundScenarioResult {
    readonly account: ReturnType<typeof seed.account>;
    readonly expense: ReturnType<typeof seedRefundedExpense>['expense'];
    readonly refunds: ReturnType<typeof seedRefundedExpense>['refunds'];
    readonly result: ConsolidationResultInterface;
}

export const runRefundScenario = Effect.fnUntraced(function* (input: RunRefundScenarioInput) {
    const account = seed.account({ externalId: 'mono-card' });
    const { expense, refunds } = seedRefundedExpense({ ...input, accountId: account.id });
    const result: ConsolidationResultInterface = yield* transferConsolidationService.consolidate(null);
    const scenario: RunRefundScenarioResult = { account, expense, refunds, result };

    return scenario;
});
