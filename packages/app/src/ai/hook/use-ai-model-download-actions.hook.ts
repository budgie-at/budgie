import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';
import { AiModelDownloadService } from '../service/ai-model-download.service';

import { useAiModelDownloadAmounts } from './use-ai-model-download-amounts.hook';

import type * as Context from 'effect/Context';

export const useAiModelDownloadActions = () => {
    const { t } = useLingui();
    const { downloaded } = useAiModelDownloadAmounts();
    const { isLoading: isRunning, run } = useSingleFlight();

    const runAction = (select: (service: Context.Service.Shape<typeof AiModelDownloadService>) => Effect.Effect<void>) => {
        void run(Effect.flatMap(AiModelDownloadService, select).pipe(toastOnFailure(t`Could not update the AI model download`)));
    };

    const handleCancel = () => {
        void run(
            Effect.gen(function* () {
                const isConfirmed = yield* confirmAlert({
                    title: t`Delete the ${downloaded} GB part?`,
                    message: t`The downloaded AI model data is removed from this phone. Nothing downloads again until you start it.`,
                    confirmText: t`Delete`,
                    cancelText: t`Keep`,
                    isDestructive: true
                });

                if (isConfirmed) {
                    const downloadService = yield* AiModelDownloadService;
                    yield* downloadService.cancel();
                }
            }).pipe(toastOnFailure(t`Could not update the AI model download`))
        );
    };

    return {
        isRunning,
        pause: () => void runAction(service => service.pause()),
        resume: () => void runAction(service => service.resume()),
        allowMobileData: () => void runAction(service => service.allowMobileData()),
        dismissNotice: () => void runAction(service => service.dismissNotice),
        cancel: handleCancel
    };
};
