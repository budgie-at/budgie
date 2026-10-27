import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Alert } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';

import type { AppServices } from '../../../@generic/runtime/app.runtime';
import type * as Effect from 'effect/Effect';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly actionButtonText: string;
    readonly confirmTitle: string;
    readonly confirmDescription: string;
    readonly errorText: string;
    readonly onAction: Effect.Effect<unknown, unknown, AppServices>;
    readonly testID: string;
}

export const AccountActionButton = ({ icon, actionButtonText, confirmTitle, confirmDescription, errorText, onAction, testID }: Props) => {
    const { t } = useLingui();

    const handlePress = () => {
        Alert.alert(confirmTitle, confirmDescription, [
            { text: t`Cancel`, style: 'cancel' },
            {
                text: actionButtonText,
                onPress: () =>
                    void appRuntime.runFork(
                        logAndContinue(onAction.pipe(toastOnFailure(errorText, t`Something went wrong. Please try again later.`)))
                    )
            }
        ]);
    };

    return (
        <HapticPressable testID={testID} onPress={handlePress}>
            <CircleIcon variant="positive" icon={icon} />
        </HapticPressable>
    );
};
