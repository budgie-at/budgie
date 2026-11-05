import { Trans } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { RecurringCalendarDayDots } from '../recurring-calendar-day-dots/recurring-calendar-day-dots';

const legendVariants = cva('flex-row flex-wrap justify-center gap-x-5xl gap-y-sm pb-md', {
    variants: { hasEntries: { true: '', false: 'opacity-0' } }
});

interface Props {
    readonly hasRecordedEntries: boolean;
    readonly hasExpectedEntries: boolean;
}

export const RecurringCalendarLegend = ({ hasRecordedEntries, hasExpectedEntries }: Props) => {
    const hasEntries = hasRecordedEntries || hasExpectedEntries;
    const showExpectedLegend = hasExpectedEntries || !hasEntries;
    const showRecordedLegend = hasRecordedEntries || !hasEntries;
    const legendAccessibility = hasEntries ? 'auto' : 'no-hide-descendants';

    return (
        <View
            className={legendVariants({ hasEntries })}
            accessible={hasEntries}
            accessibilityElementsHidden={!hasEntries}
            importantForAccessibility={legendAccessibility}
        >
            {showExpectedLegend ? (
                <View className="flex-row items-center gap-x-sm">
                    <RecurringCalendarDayDots actualDots={0} forecastedDots={1} isSelected={false} className="static" />
                    <Text maxFontSizeMultiplier={1.5} className="text-[12px] text-secondary-foreground">
                        <Trans>Expected</Trans>
                    </Text>
                </View>
            ) : null}
            {showRecordedLegend ? (
                <View className="flex-row items-center gap-x-sm">
                    <RecurringCalendarDayDots actualDots={1} forecastedDots={0} isSelected={false} className="static" />
                    <Text maxFontSizeMultiplier={1.5} className="text-[12px] text-secondary-foreground">
                        <Trans>Recorded</Trans>
                    </Text>
                </View>
            ) : null}
        </View>
    );
};
