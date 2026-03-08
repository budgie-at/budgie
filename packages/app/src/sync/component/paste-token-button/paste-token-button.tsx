import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { getStringAsync } from 'expo-clipboard';
import Toast from 'react-native-toast-message';

import { isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { isLikelyMonoToken } from '../../type-guard/is-likely-mono-token.type-guard';

interface Props {
    readonly onPaste: (token: string) => void;
}

export const PasteTokenButton = ({ onPaste }: Props) => {
    const { t } = useLingui();

    const handlePress = async () => {
        const clipboardContent = await getStringAsync();

        if (!isNotEmptyString(clipboardContent)) {
            Toast.show({ type: 'info', text1: t`Clipboard is empty` });

            return;
        }

        const trimmedToken = clipboardContent.trim();

        if (!isLikelyMonoToken(trimmedToken)) {
            Toast.show({ type: 'error', text1: t`Clipboard doesn't contain a valid Monobank token` });

            return;
        }

        onPaste(trimmedToken);
    };

    return <Button leftIcon={UserIconNameEnum.ClipboardPaste} size="sm" variant="secondary" onPress={handlePress} />;
};
