import { RecurringRefreshService } from '@budgie/recurring';
import * as Effect from 'effect/Effect';

import { Workload } from '../../@generic/service/workload.service';
import { RecurringRefreshModeEnum } from '../enum/recurring-refresh-mode.enum';
import { RecurringReminderService } from '../service/recurring-reminder.service';

export const scheduleRecurringRefresh = Effect.fn('scheduleRecurringRefresh')(function* (mode: RecurringRefreshModeEnum) {
    const workload = yield* Workload;
    const recurringRefreshService = yield* RecurringRefreshService;
    const recurringReminderService = yield* RecurringReminderService;
    const now = new Date();

    yield* workload.schedule(
        `recurring-refresh-${mode}`,
        (mode === RecurringRefreshModeEnum.FULL ? recurringRefreshService.refresh(now) : recurringRefreshService.matchRecent(now)).pipe(
            Effect.andThen(recurringReminderService.reschedule(now))
        ),
        { replace: true }
    );
});
