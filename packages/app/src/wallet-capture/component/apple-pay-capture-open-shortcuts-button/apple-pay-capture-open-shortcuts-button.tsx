import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { Linking } from 'react-native';
import Toast from 'react-native-toast-message';

import { Button } from '../../../@generic/component/button/button';
import { runWithErrorToast } from '../../utils/run-with-error-toast.util';

interface Props {
    readonly testID: string;
}

export const ApplePayCaptureOpenShortcutsButton = ({ testID }: Props) => {
    const { t } = useLingui();

    const handlePressOpenShortcuts = () =>
        void runWithErrorToast(
            Effect.gen(function* () {
                if (!(yield* Effect.promise(() => Linking.canOpenURL('shortcuts://')))) {
                    Toast.show({ type: 'error', text1: t`Could not open Shortcuts`, text2: t`Shortcuts is not available on this device.` });

                    return;
                }
                yield* Effect.promise(() => Linking.openURL('shortcuts://'));
            }),
            t`Could not open Shortcuts`
        );

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
