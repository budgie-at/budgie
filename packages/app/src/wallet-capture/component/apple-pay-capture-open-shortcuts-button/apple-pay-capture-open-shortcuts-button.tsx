import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import { Linking } from 'react-native';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { appRuntime } from '../../../@generic/runtime/app.runtime';

interface Props {
    readonly testID: string;
}

export const ApplePayCaptureOpenShortcutsButton = ({ testID }: Props) => {
    const { t } = useLingui();

    const handlePressOpenShortcuts = () => {
        appRuntime.runFork(
            Effect.gen(function* () {
                if (!(yield* Effect.promise(() => Linking.canOpenURL('shortcuts://')))) {
                    Toast.show({ type: 'error', text1: t`Could not open Shortcuts`, text2: t`Shortcuts is not available on this device.` });

                    return;
                }
                yield* Effect.promise(() => Linking.openURL('shortcuts://'));
            }).pipe(
                Effect.tapCause(Effect.logError),
                Effect.catchCause(cause =>
                    Effect.sync(() => {
                        Toast.show({ type: 'error', text1: t`Could not open Shortcuts`, text2: getErrorMessage(Cause.squash(cause)) });
                    })
                )
            )
        );
    };

    return (
        <Button
            testID={testID}
            onPress={handlePressOpenShortcuts}
            content={t`Open Shortcuts`}
            leftIcon={UserIconNameEnum.ExternalLink}
            variant="positive"
        />
    );
};
