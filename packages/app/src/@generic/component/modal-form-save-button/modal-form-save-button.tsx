import { useLingui } from '@lingui/react/macro';
import { StyleSheet, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../button/button';

interface Props {
    readonly disabled?: boolean;
    readonly onPress: () => void;
    readonly testID?: string;
}

export const ModalFormSaveButton = ({ disabled, onPress, testID }: Props) => {
    const { t } = useLingui();
    const hasTestID = isNotEmptyString(testID);

    return (
        <View className="relative flex-1">
            <Button className="w-full" variant="cta" onPress={onPress} disabled={disabled} content={t`Save`} testID={testID} />
            {hasTestID ? (
                <View collapsable={false} nativeID={testID} pointerEvents="none" style={StyleSheet.absoluteFill} testID={testID} />
            ) : null}
        </View>
    );
};
