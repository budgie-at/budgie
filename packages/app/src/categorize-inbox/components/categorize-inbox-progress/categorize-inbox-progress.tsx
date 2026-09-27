import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { AiProgressBar } from '../../../settings/components/ai-progress-bar/ai-progress-bar';
import { CategorizeInboxPanelSelector } from '../categorize-inbox-panel/categorize-inbox-panel.selector';

interface Props {
    readonly remainingCount: number;
    readonly categorizedCount: number;
}

export const CategorizeInboxProgress = ({ remainingCount, categorizedCount }: Props) => {
    const { t } = useLingui();

    const totalCount = remainingCount + categorizedCount;
    const progress = isPositiveNumber(totalCount) ? (categorizedCount / totalCount) * 100 : 0;
    const remainingText = t({ message: plural(remainingCount, { one: '# left', other: '# left' }) });
    const doneText = t({ message: plural(categorizedCount, { one: '# done', other: '# done' }) });
    const progressText = [remainingText, doneText].join(' · ');
    const accessibilityValue = { min: 0, max: totalCount, now: categorizedCount, text: progressText };

    return (
        <View
            className="gap-y-md"
            accessible
            accessibilityRole="progressbar"
            accessibilityValue={accessibilityValue}
            testID={CategorizeInboxPanelSelector.Progress}
        >
            <Text className="text-xs font-medium text-secondary-foreground" numberOfLines={1}>
                {progressText}
            </Text>
            <AiProgressBar progress={progress} />
        </View>
    );
};
