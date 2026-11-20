import { UserIconNameEnum } from '@budgie/contracts';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly label: string;
    readonly accessibilityLabel: string;
    readonly onPress: () => void;
    readonly testID?: string;
    readonly labelTestID?: string;
}

const continuousBorder = { borderCurve: 'continuous' as const };

export const YieldFilterChip = ({ label, accessibilityLabel, onPress, testID, labelTestID }: Props) => (
    <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        className="min-h-[44px] min-w-[44px] max-w-full shrink justify-center"
        testID={testID}
    >
        <View
            className="min-h-[36px] shrink flex-row items-center gap-x-xs rounded-full border border-secondary-corner bg-secondary-background px-md py-xs"
            style={continuousBorder}
        >
            <Text testID={labelTestID} numberOfLines={1} className="shrink text-sm font-semibold text-primary" maxFontSizeMultiplier={2}>
                {label}
            </Text>
            <Icon icon={UserIconNameEnum.X} size={16} className="text-secondary-foreground" />
        </View>
    </Pressable>
);
