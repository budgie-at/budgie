import { RuleEngineService, RuleHost, RuleService } from '@budgie/rules';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { AccountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { ExchangeRatesService } from '../../exchange-rate/service/exchange-rates.service';
import { EntryBaseValuationService } from '../../money-data/service/entry-base-valuation.service';
import { assertTransferAccountsAreNotDebt } from '../../transaction/utils/assert-transfer-accounts-are-not-debt.util';

const ruleHostLayer = Layer.effect(
    RuleHost,
    Effect.gen(function* () {
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const entryBaseValuationService = yield* EntryBaseValuationService;
        const exchangeRatesService = yield* ExchangeRatesService;

        return RuleHost.of({
            convertAmount: exchangeRatesService.convert,
            valueEntry: (accountId, amount, operatedAt) =>
                entryBaseValuationService.valueMicroUnitEntry({ accountId, amount, operatedAt, externalSource: null }),
            refreshBalances: accountBalanceIncrementalService.updateAllBalances(true),
            assertTransferAccountsAllowed: assertTransferAccountsAreNotDebt
        });
    })
).pipe(Layer.provide([AccountBalanceIncrementalService.layer, EntryBaseValuationService.layer, ExchangeRatesService.layer]));

export const rulesLayer = Layer.mergeAll(RuleEngineService.layer, RuleService.layer).pipe(Layer.provide(ruleHostLayer));
