import { Text, View } from 'react-native';

import { ScreenChromeFooter } from '@rnw-community/react-native-screen-chrome';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';

interface Props {
    readonly label: string;
    readonly testID: string;
    readonly onPress: () => void;
}

const HIDDEN_EDGE_FADE_PROPS = { style: { display: 'none' } } as const;
const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const CategorizeInboxPrimaryBar = ({ label, testID, onPress }: Props) => (
    <ScreenChromeFooter includeBottomSafeArea={false} edgeFadeProps={HIDDEN_EDGE_FADE_PROPS}>
        <View className="border-t-hairline border-surface-separator bg-surface px-5xl pb-safe pt-lg">
            <HapticPressable
                onPress={onPress}
                className="h-[52px] items-center justify-center rounded-full bg-cta-background px-5xl active:opacity-80"
                style={CONTINUOUS_CORNERS}
                accessibilityRole="button"
                accessibilityLabel={label}
                testID={testID}
            >
                <Text
                    className="text-cta-foreground text-[17px] font-semibold tabular-nums"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                >
                    {label}
                </Text>
            </HapticPressable>
        </View>
    </ScreenChromeFooter>
);
