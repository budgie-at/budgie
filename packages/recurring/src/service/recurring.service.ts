import { SettingsRepository } from '@budgie/contracts';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { RecurringRepository } from '../repository/recurring.repository';
import { detectRecurringSeries, projectRecurringMonth } from '../series/recurring-series';

const HISTORY_MONTHS = 24;

export class RecurringService extends Context.Service<RecurringService>()('@budgie/recurring/RecurringService', {
    make: Effect.gen(function* () {
        const recurringRepository = yield* RecurringRepository;
        const settingsRepository = yield* SettingsRepository;

        return {
            calendar: Effect.fn('RecurringService.calendar')(function* (year: number, month: number, now: Date) {
                const { defaultInstrumentId, language } = yield* settingsRepository.getSettings();
                const since = new Date(now.getFullYear(), now.getMonth() - HISTORY_MONTHS, now.getDate());
                const charges = yield* recurringRepository.findCharges(defaultInstrumentId, language, since);

                return projectRecurringMonth(detectRecurringSeries(charges), year, month, now);
            })
        };
    })
}) {
    static readonly layer = Layer.effect(RecurringService, RecurringService.make).pipe(
        Layer.provide([RecurringRepository.layer, SettingsRepository.layer])
    );
}
