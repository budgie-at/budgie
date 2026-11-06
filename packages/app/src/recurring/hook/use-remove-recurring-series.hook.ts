import { RecurringSeriesSourceEnum } from '@budgie/contracts';
import { RecurringService } from '@budgie/recurring';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../@generic/utils/log-and-continue.util';
import { showActionToast } from '../../@generic/utils/show-action-toast/show-action-toast';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { RecurringRefreshModeEnum } from '../enum/recurring-refresh-mode.enum';
import { scheduleRecurringRefresh } from '../utils/schedule-recurring-refresh.util';

import type { RecurringRemovalInterface, RecurringSeriesListItemInterface } from '@budgie/recurring';
import type { EmptyFn } from '@rnw-community/shared';

export const useRemoveRecurringSeries = () => {
    const { t } = useLingui();

    return (series: Pick<RecurringSeriesListItemInterface, 'id' | 'title'>, onRemoved?: EmptyFn) => {
        const { id: seriesId, title } = series;
        const undoRemoval = (removal: Pick<RecurringRemovalInterface, 'source' | 'previousUserState'>) =>
            appRuntime.runFork(
                logAndContinue(
                    Effect.flatMap(RecurringService, recurringService =>
                        removal.source === RecurringSeriesSourceEnum.DETECTED
                            ? recurringService.restoreUserState(seriesId, removal.previousUserState)
                            : recurringService.restore(seriesId)
                    ).pipe(
                        Effect.andThen(scheduleRecurringRefresh(RecurringRefreshModeEnum.RECENT)),
                        toastOnFailure(t`Could not restore recurring payment.`)
                    )
                )
            );

        appRuntime.runFork(
            logAndContinue(
                Effect.gen(function* () {
                    const recurringService = yield* RecurringService;
                    const removal = yield* recurringService.remove(seriesId);
                    yield* scheduleRecurringRefresh(RecurringRefreshModeEnum.RECENT);
                    const message =
                        removal.source === RecurringSeriesSourceEnum.DETECTED ? t`${title} is no longer tracked` : t`${title} deleted`;

                    onRemoved?.();
                    showActionToast(message, { label: t`Undo`, onPress: () => void undoRemoval(removal) });
                }).pipe(toastOnFailure(t`Could not update recurring payment.`))
            )
        );
    };
};
