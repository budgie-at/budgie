import { RecurringSeriesSourceEnum } from '@budgie/contracts';
import { RecurringService } from '@budgie/recurring';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { appRuntime } from '../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../@generic/utils/log-and-continue.util';
import { showActionToast } from '../../@generic/utils/show-action-toast/show-action-toast';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';

import type { RecurringSeriesListItemInterface } from '@budgie/recurring';
import type { EmptyFn } from '@rnw-community/shared';

export const useRemoveRecurringSeries = () => {
    const { t } = useLingui();

    return (series: Pick<RecurringSeriesListItemInterface, 'id' | 'title'>, onRemoved?: EmptyFn) => {
        const { id: seriesId, title } = series;
        const undoRemoval = (source: RecurringSeriesSourceEnum) =>
            appRuntime.runFork(
                logAndContinue(
                    Effect.flatMap(RecurringService, recurringService =>
                        source === RecurringSeriesSourceEnum.DETECTED
                            ? recurringService.undismiss(seriesId)
                            : recurringService.restore(seriesId)
                    ).pipe(toastOnFailure(t`Could not restore recurring payment.`))
                )
            );

        appRuntime.runFork(
            logAndContinue(
                Effect.gen(function* () {
                    const recurringService = yield* RecurringService;
                    const { source } = yield* recurringService.remove(seriesId);
                    const message = source === RecurringSeriesSourceEnum.DETECTED ? t`${title} is no longer tracked` : t`${title} deleted`;

                    onRemoved?.();
                    showActionToast(message, { label: t`Undo`, onPress: () => void undoRemoval(source) });
                }).pipe(toastOnFailure(t`Could not update recurring payment.`))
            )
        );
    };
};
