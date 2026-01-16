import { UserIconNameEnum } from '@budgie/contracts';
import { BottomSheetFooter, BottomSheetFooterProps } from '@gorhom/bottom-sheet';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyFn, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../button/button';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

interface Props extends BottomSheetFooterProps {
    readonly selectedCount: number;
    readonly onClose: EmptyFn;
    readonly onClear: EmptyFn;
}

export const MultiSelectFooter = ({ selectedCount, onClose, onClear, animatedFooterPosition }: Props) => {
    const { t } = useLingui();
    const { bottom } = useSafeAreaInsets();

    const buttonText = isPositiveNumber(selectedCount) ? t`Done (${selectedCount})` : t`Done`;
    const containerStyle = { paddingBottom: bottom };
    const hasSelection = isPositiveNumber(selectedCount);

    return (
        <BottomSheetFooter animatedFooterPosition={animatedFooterPosition}>
            <View className="gap-md pt-xl px-7xl border-t border-t-secondary-corner bg-primary-reverse" style={containerStyle}>
                <View className="flex-row gap-x-xl">
                    {hasSelection ? <Button leftIcon={UserIconNameEnum.X} onPress={onClear} variant="destructive" /> : null}

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
