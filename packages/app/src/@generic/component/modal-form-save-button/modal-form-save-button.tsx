import { useLingui } from '@lingui/react/macro';
import { StyleSheet, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../button/button';

interface Props {
    readonly disabled?: boolean;
    readonly onPress: () => void;
    readonly testID?: string;
    readonly content?: string;
}

export const ModalFormSaveButton = ({ disabled, onPress, testID, content }: Props) => {
    const { t } = useLingui();
    const label = content ?? t`Save`;
    const hasTestID = isNotEmptyString(testID);
    const buttonClassName = hasTestID ? 'w-full' : 'flex-1';

    const button = (
        <Button className={buttonClassName} variant="cta" onPress={onPress} disabled={disabled} content={label} testID={testID} />
    );

    if (!hasTestID) {
        return button;
    }

    return (
        <View className="relative flex-1">
            {button}
            <View collapsable={false} nativeID={testID} pointerEvents="none" style={StyleSheet.absoluteFill} testID={testID} />
        </View>
    );
};
