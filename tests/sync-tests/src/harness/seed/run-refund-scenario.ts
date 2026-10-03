import { TransferConsolidationService } from '@budgie/sync';
import * as Effect from 'effect/Effect';

import { seed } from './seed';
import { seedRefundedExpense } from './seed-refund-fixture';

import type { ConsolidationResultInterface } from '@budgie/consolidation';
import type { AccountEntityInterface, TransactionEntityInterface } from '@budgie/contracts';

type RunRefundScenarioInput = Omit<Parameters<typeof seedRefundedExpense>[0], 'accountId'>;

interface RunRefundScenarioResult {
    readonly account: AccountEntityInterface;
    readonly expense: TransactionEntityInterface;
    readonly refunds: TransactionEntityInterface[];
    readonly result: ConsolidationResultInterface;
}

export const runRefundScenario = Effect.fnUntraced(function* (input: RunRefundScenarioInput) {
    const transferConsolidationService = yield* TransferConsolidationService;
    const account = yield* seed.account({ externalId: 'mono-card' });
    const { expense, refunds } = yield* seedRefundedExpense({ ...input, accountId: account.id });
    const result: ConsolidationResultInterface = yield* transferConsolidationService.consolidate(null);
    const scenario: RunRefundScenarioResult = { account, expense, refunds, result };

    return scenario;
});
