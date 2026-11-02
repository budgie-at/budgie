import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { NotificationFeedbackType } from 'expo-haptics';

import { isDefined } from '@rnw-community/shared';

import { useSingleFlight } from '../../@generic/hook/use-single-flight.hook';
import { useVibration } from '../../@generic/hook/use-vibration.hook';
import { appRuntime } from '../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../@generic/utils/log-and-continue.util';
import { showActionToast } from '../../@generic/utils/show-action-toast/show-action-toast';
import { showSuccessToast } from '../../@generic/utils/show-success-toast/show-success-toast';
import { toastOnFailure } from '../../@generic/utils/toast-on-failure.util';

import type { ShelvedAccountFeedbackInterface } from '../interface/shelved-account-feedback.interface';

export const useShelvedAccountAction = () => {
    const { t } = useLingui();
    const [notify] = useVibration();
    const { isLoading, run } = useSingleFlight();
    const fallbackErrorText = t`Something went wrong. Please try again later.`;

    const showFeedback = ({ successText, undo }: ShelvedAccountFeedbackInterface) => {
        notify(NotificationFeedbackType.Success);

        if (!isDefined(undo)) {
            showSuccessToast(successText);

            return;
        }

        showActionToast(successText, {
            label: t`Undo`,
            onPress: () => void appRuntime.runFork(logAndContinue(undo.pipe(toastOnFailure(t`Could not undo.`, fallbackErrorText))))
        });
    };

    const runWithFeedback = (feedback: ShelvedAccountFeedbackInterface) =>
        void run(
            feedback.action.pipe(
                Effect.tap(() => Effect.sync(() => void showFeedback(feedback))),
                toastOnFailure(feedback.errorText, fallbackErrorText)
            )
        );

    return { isLoading, runWithFeedback };
};
