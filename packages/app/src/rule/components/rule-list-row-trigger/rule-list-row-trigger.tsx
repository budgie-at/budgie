import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import type { RuleRowSummaryInterface } from '../../interface/rule-row-summary.interface';

interface Props {
    readonly summary: Pick<RuleRowSummaryInterface, 'trigger' | 'triggerPrefix' | 'triggerValue' | 'triggerOverflow'>;
    readonly extraLabel: string | null;
    readonly testID: string;
}

const fixedTextClassName = 'shrink-0 text-[13px] leading-[18px] text-secondary-foreground';
const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const RuleListRowTrigger = ({ summary, extraLabel, testID }: Props) => (
    <View testID={testID} className="flex-row items-center">
        {isNotEmptyString(summary.triggerOverflow) ? (
            <>
                <Text className={fixedTextClassName} numberOfLines={1}>
                    {summary.triggerPrefix}
                </Text>
                <View className="min-w-0 shrink">
                    <Text className={fixedTextClassName} numberOfLines={1}>
                        {summary.triggerValue}
                    </Text>
                </View>
                <Text className={fixedTextClassName} numberOfLines={1}>
                    {` ${summary.triggerOverflow}`}
                </Text>
            </>
        ) : (
            <Text className="shrink text-[13px] leading-[18px] text-secondary-foreground" numberOfLines={1}>
                {summary.trigger}
            </Text>
        )}
        {isNotEmptyString(extraLabel) ? (
            <View className="ml-xs shrink-0 rounded-full bg-surface-fill px-sm" style={CONTINUOUS_CORNERS}>
                <Text className="text-[12px] font-semibold leading-[18px] text-secondary-foreground" numberOfLines={1}>
                    {extraLabel}
                </Text>
            </View>
        ) : null}
    </View>
);
