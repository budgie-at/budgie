import { RuleEngineService, RuleHost, RuleService } from '@budgie/rules';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { AccountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { assertTransferAccountsAreNotDebt } from '../../transaction/utils/assert-transfer-accounts-are-not-debt.util';

const ruleHostLayer = Layer.effect(
    RuleHost,
    Effect.gen(function* () {
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;

        return RuleHost.of({
            refreshBalances: accountBalanceIncrementalService.updateAllBalances(true),
            assertTransferAccountsAllowed: assertTransferAccountsAreNotDebt
        });
    })
).pipe(Layer.provide(AccountBalanceIncrementalService.layer));

export const rulesLayer = Layer.mergeAll(RuleEngineService.layer, RuleService.layer).pipe(Layer.provide(ruleHostLayer));
