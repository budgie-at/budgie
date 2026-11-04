import { Trans } from '@lingui/react/macro';
import { ActivityIndicator, Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';

interface Props {
    readonly onChooseAnotherBank: () => void;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const EnableBankingWaitingStep = ({ onChooseAnotherBank }: Props) => (
    <View className="gap-y-7xl pt-[96px]">
        <View className="items-center gap-y-3xl px-3xl">
            <ActivityIndicator size="large" colorClassName="accent-primary" />
            <Text className="text-secondary-foreground text-center text-[15px] leading-[20px]">
                <Trans>Budgie continues when you return. If you stay in the browser, use the Return to Budgie link on the page.</Trans>
            </Text>
        </View>
        <HapticPressable
            onPress={onChooseAnotherBank}
            accessibilityRole="button"
            className="min-h-[50px] items-center justify-center rounded-3xl bg-surface-row px-3xl py-lg active:opacity-70"
            style={CONTINUOUS_CORNERS}
        >
            <Text className="text-primary text-[17px]">
                <Trans>Choose another bank</Trans>
            </Text>
        </HapticPressable>
    </View>
);
