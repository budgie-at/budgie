import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

interface Props {
    readonly prefix: string;
    readonly value: string;
    readonly extraLabel: string | null;
    readonly testID: string;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const RuleListRowTrigger = ({ prefix, value, extraLabel, testID }: Props) => (
    <View testID={testID} className="flex-row items-center">
        <Text className="shrink text-[13px] leading-[18px] text-secondary-foreground" numberOfLines={1}>
            <Text>{prefix} </Text>
            {value}
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
