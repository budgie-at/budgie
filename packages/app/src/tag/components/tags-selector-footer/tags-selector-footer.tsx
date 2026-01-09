import { UserIconNameEnum } from '@budgie/contracts';
import { BottomSheetFooter, BottomSheetFooterProps } from '@gorhom/bottom-sheet';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isPositiveNumber } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

interface Props extends BottomSheetFooterProps {
    readonly selectedTagsCount: number;
    readonly onClose: () => void;
}

export const TagsSelectorFooter = ({ selectedTagsCount, onClose, animatedFooterPosition }: Props) => {
    const { t } = useLingui();
    const { bottom } = useSafeAreaInsets();
    const buttonText = isPositiveNumber(selectedTagsCount) ? t`Done (${selectedTagsCount})` : t`Done`;
    const containerStyle = { paddingBottom: bottom };

    return (
        <BottomSheetFooter animatedFooterPosition={animatedFooterPosition}>
            <View className="gap-md pt-xl px-7xl border-t border-t-secondary-corner bg-primary-reverse" style={containerStyle}>
                <View className="flex-row gap-x-xl">
                    <HapticPressable
                        onPress={onClose}
                        className="bg-primary-reverse flex-1 rounded-5xl p-2xl border border-secondary-corner"
                    >
                        <Text className="text-primary text-center">
                            <Trans>Cancel</Trans>
                        </Text>
                    </HapticPressable>

                    <HapticPressable
                        onPress={onClose}
                        className="bg-primary flex-1 rounded-5xl p-2xl flex-row gap-x-md items-center justify-center"
                    >
                        <Icon icon={UserIconNameEnum.Check} className="text-primary-reverse" size={16} />

                        <Text className="text-primary-reverse text-center">{buttonText}</Text>
                    </HapticPressable>
                </View>
            </View>
        </BottomSheetFooter>
    );
};
