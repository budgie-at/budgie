import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Linking } from 'react-native';
import Toast from 'react-native-toast-message';

import { getErrorMessage } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';

interface Props {
    readonly testID: string;
}

const SHORTCUTS_URL = 'shortcuts://';

export const ApplePayCaptureOpenShortcutsButton = ({ testID }: Props) => {
    const { t } = useLingui();

    const handleOpenShortcuts = async () => {
        try {
            const canOpenShortcuts = await Linking.canOpenURL(SHORTCUTS_URL);

            if (!canOpenShortcuts) {
                Toast.show({
                    type: 'error',
                    text1: t`Could not open Shortcuts`,
                    text2: t`Shortcuts is not available on this device.`
                });

                return;
            }

            await Linking.openURL(SHORTCUTS_URL);
        } catch (error) {
            Toast.show({ type: 'error', text1: t`Could not open Shortcuts`, text2: getErrorMessage(error) });
        }
    };

    const handlePressOpenShortcuts = () => void handleOpenShortcuts();

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
