import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxPanelSelector } from '../categorize-inbox-panel/categorize-inbox-panel.selector';

export const CategorizeInboxProgress = () => {
    const { t } = useLingui();
    const { remainingCount, categorizedCount } = useCategorizeInboxContext();

    const totalCount = remainingCount + categorizedCount;
    const progress = isPositiveNumber(totalCount) ? (categorizedCount / totalCount) * 100 : 0;
    const progressText = [
        t({ message: plural(remainingCount, { one: '# left', other: '# left' }) }),
        t({ message: plural(categorizedCount, { one: '# done', other: '# done' }) })
    ].join(' · ');
    const accessibilityValue = { min: 0, max: totalCount, now: categorizedCount, text: progressText };
    const barStyle = { width: `${progress}%` as const };

    return (
        <View
            className="gap-y-md"
            accessible
            accessibilityRole="progressbar"
            accessibilityValue={accessibilityValue}
            testID={CategorizeInboxPanelSelector.Progress}
        >
            <View className="flex-row items-center justify-between gap-x-md">
                <Text className="text-xs font-medium text-secondary-foreground tabular-nums" numberOfLines={1}>
                    {progressText}
                </Text>
                <Text className="text-xs font-semibold text-primary tabular-nums" numberOfLines={1}>
                    {`${Math.round(progress)}%`}
                </Text>
            </View>
            <View className="h-[4px] overflow-hidden rounded-full bg-secondary-corner">
                <View className="h-[4px] rounded-full bg-positive-fill" style={barStyle} />
            </View>
        </View>
    );
};
