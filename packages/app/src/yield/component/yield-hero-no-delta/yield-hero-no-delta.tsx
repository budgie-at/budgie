import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

const LINE_MAX_FONT_SIZE_MULTIPLIER = 2;

export const YieldHeroNoDelta = () => (
    <View className="flex-row">
        <View className="flex-row items-center border border-transparent px-sm py-[2px]">
            <Text className="text-xs text-secondary-foreground" numberOfLines={1} maxFontSizeMultiplier={LINE_MAX_FONT_SIZE_MULTIPLIER}>
                <Trans>No earlier period to compare</Trans>
            </Text>
        </View>
    </View>
);
