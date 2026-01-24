import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isPositiveNumber } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useThemeContext } from '../../../theme/context/theme.context';

const BG_LIGHT = '#FFFFFF';
const BG_DARK = '#000000';
const BORDER_LIGHT = '#E5E5E5';
const BORDER_DARK = '#333333';

const styles = StyleSheet.create({
    button: {
        alignItems: 'center',
        borderRadius: 40,
        flex: 1,
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'center',
        padding: 16
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 16
    },
    buttonText: {
        textAlign: 'center'
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1
    },
    container: {
        borderTopWidth: 1,
        bottom: 0,
        gap: 12,
        left: 0,
        paddingHorizontal: 56,
        paddingTop: 16,
        position: 'absolute',
        right: 0
    },
    doneButton: {
        backgroundColor: '#000000'
    },
    doneButtonText: {
        color: '#FFFFFF',
        textAlign: 'center'
    }
});

interface Props {
    readonly selectedTagIds: number[];
    readonly onResolve: (tagIds: number[] | null) => void;
}

export const TagsSelectorModalFooter = ({ selectedTagIds, onResolve }: Props) => {
    const selectedTagsCount = selectedTagIds.length;
    const handleCancel = () => void onResolve(null);
    const handleDone = () => void onResolve(selectedTagIds);
    const { t } = useLingui();
    const { bottom } = useSafeAreaInsets();
    const { isDarkColorSchema } = useThemeContext();

    const buttonText = isPositiveNumber(selectedTagsCount) ? t`Done (${selectedTagsCount})` : t`Done`;
    const backgroundColor = isDarkColorSchema ? BG_DARK : BG_LIGHT;
    const borderColor = isDarkColorSchema ? BORDER_DARK : BORDER_LIGHT;
    const textColor = isDarkColorSchema ? '#FFFFFF' : '#000000';

    const containerStyle: ViewStyle = {
        ...styles.container,
        paddingBottom: bottom,
        backgroundColor,
        borderTopColor: borderColor
    };

    const cancelButtonStyle: ViewStyle = {
        ...styles.button,
        ...styles.cancelButton,
        borderColor
    };

    const cancelTextStyle: TextStyle = {
        ...styles.buttonText,
        color: textColor
    };

    const doneButtonStyle: ViewStyle = {
        ...styles.button,
        ...styles.doneButton
    };

    return (
        <View style={containerStyle}>
            <View style={styles.buttonRow}>
                <HapticPressable onPress={handleCancel} style={cancelButtonStyle}>
                    <Text style={cancelTextStyle}>
                        <Trans>Cancel</Trans>
                    </Text>
                </HapticPressable>

                <HapticPressable onPress={handleDone} style={doneButtonStyle}>
                    <Icon icon={UserIconNameEnum.Check} color="#FFFFFF" size={16} />
                    <Text style={styles.doneButtonText}>{buttonText}</Text>
                </HapticPressable>
            </View>
        </View>
    );
};
