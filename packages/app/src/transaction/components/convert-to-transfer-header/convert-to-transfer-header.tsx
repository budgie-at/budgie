import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';

interface Props {
    readonly isLoading: boolean;
    readonly onFeePress: () => void;
}

export const ConvertToTransferHeader = ({ isLoading, onFeePress }: Props) => {
    const { t } = useLingui();
    const accessibilityState = { busy: isLoading };

    return (
        <View className="flex-row items-center gap-sm px-xl py-lg">
            <View className="w-[44px]" />
            <View
                className="flex-1"
                accessible
                accessibilityRole="header"
                accessibilityLabel={t`Convert to Transfer`}
                accessibilityState={accessibilityState}
            >
                <LoadingContent isLoading={isLoading}>
                    <Text maxFontSizeMultiplier={2} className="text-primary text-center text-[17px] leading-[22px] font-semibold">
                        <Trans>Convert to Transfer</Trans>
                    </Text>
                </LoadingContent>
            </View>
            <HapticPressable
                accessibilityRole="button"
                accessibilityLabel={t`Fee`}
                disabled={isLoading}
                onPress={onFeePress}
                className="h-[44px] w-[44px] items-center justify-center rounded-full bg-grouped-surface-row active:opacity-70"
            >
                <Icon icon={UserIconNameEnum.Receipt} size={20} className="text-primary" />
            </HapticPressable>
        </View>
    );
};
