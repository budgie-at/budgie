import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { useEffectAction } from '../../@generic/hook/use-effect-action.hook';
import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { AiModelDownloadService } from '../service/ai-model-download.service';

import { useAiModelDownloadAmounts } from './use-ai-model-download-amounts.hook';

import type * as Context from 'effect/Context';

export const useAiModelDownloadActions = () => {
    const { t } = useLingui();
    const { downloaded } = useAiModelDownloadAmounts();
    const [run, isRunning] = useEffectAction(t`Could not update the AI model download`);

    const runAction = (select: (service: Context.Service.Shape<typeof AiModelDownloadService>) => Effect.Effect<void>) => {
        run(Effect.flatMap(AiModelDownloadService, select));
    };

    const handleCancel = async () => {
        const isConfirmed = await confirmAlert({
            title: t`Delete the ${downloaded} GB part?`,
            message: t`The downloaded AI model data is removed from this phone. Nothing downloads again until you start it.`,
            confirmText: t`Delete`,
            cancelText: t`Keep`,
            isDestructive: true
        });

        if (isConfirmed) {
            runAction(service => service.cancel());
        }
    };

    return {
        isRunning,
        pause: () => void runAction(service => service.pause()),
        resume: () => void runAction(service => service.resume()),
        allowMobileData: () => void runAction(service => service.allowMobileData()),
        dismissNotice: () => void runAction(service => service.dismissNotice),
        cancel: () => void handleCancel()
    };
};
