import { BudgetSinkingFundRepository } from '@budgie/budget';
import { SettingsRepository } from '@budgie/contracts';
import { ExchangeRateRepository } from '@budgie/market';
import { buildRecurringActiveCondition, RecurringRepository } from '@budgie/recurring';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { buildFundSuggestions } from '../utils/build-fund-suggestions.util';

export class BudgetFundSuggestionService extends Context.Service<BudgetFundSuggestionService>()('@budgie/app/BudgetFundSuggestionService', {
    make: Effect.gen(function* () {
        const budgetSinkingFundRepository = yield* BudgetSinkingFundRepository;
        const exchangeRateRepository = yield* ExchangeRateRepository;
        const recurringRepository = yield* RecurringRepository;
        const settingsRepository = yield* SettingsRepository;

        return {
            findSuggestions: Effect.fn('BudgetFundSuggestionService.findSuggestions')(function* (
                budgetId: number,
                budgetInstrumentId: number,
                now: Date
            ) {
                const { defaultInstrumentId, language } = yield* settingsRepository.getSettings();
                const exchangeRate =
                    isDefined(defaultInstrumentId) && defaultInstrumentId !== budgetInstrumentId
                        ? yield* exchangeRateRepository.findByBaseAndQuoteIds(defaultInstrumentId, budgetInstrumentId)
                        : null;
                const series = yield* recurringRepository.findSeriesRows(defaultInstrumentId, language, buildRecurringActiveCondition());
                const funds = yield* budgetSinkingFundRepository.getByBudget(budgetId);

                return buildFundSuggestions(
                    series,
                    funds.flatMap(fund => (isDefined(fund.recurringSeriesId) ? [fund.recurringSeriesId] : [])),
                    isDefined(exchangeRate) ? exchangeRate.rate : 1,
                    now
                );
            })
        };
    })
}) {
    static readonly layer = Layer.effect(BudgetFundSuggestionService, BudgetFundSuggestionService.make).pipe(
        Layer.provide([
            BudgetSinkingFundRepository.layer,
            ExchangeRateRepository.layer,
            RecurringRepository.layer,
            SettingsRepository.layer
        ])
    );
}
