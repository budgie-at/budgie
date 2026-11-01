import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

interface Props {
    readonly trigger: string;
    readonly overflow: string | null;
    readonly extraLabel: string | null;
    readonly testID: string;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const RuleListRowTrigger = ({ trigger, overflow, extraLabel, testID }: Props) => {
    const hasOverflow = isNotEmptyString(overflow);
    const text = hasOverflow ? `${trigger} ${overflow}` : trigger;
    const ellipsizeMode = hasOverflow ? 'middle' : 'tail';

    return (
        <View testID={testID} className="flex-row items-center">
            <Text className="shrink text-[13px] leading-[18px] text-secondary-foreground" numberOfLines={1} ellipsizeMode={ellipsizeMode}>
                {text}
            </Text>
            {isNotEmptyString(extraLabel) ? (
                <View className="ml-xs shrink-0 rounded-full bg-surface-fill px-sm" style={CONTINUOUS_CORNERS}>
                    <Text className="text-[12px] font-semibold leading-[18px] text-secondary-foreground" numberOfLines={1}>
                        {extraLabel}
                    </Text>
                </View>
            ) : null}
        </View>
    );
};
