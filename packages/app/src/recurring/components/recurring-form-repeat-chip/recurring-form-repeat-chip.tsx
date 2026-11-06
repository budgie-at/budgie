import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { RecurringRepeatChoiceEnum } from '../../enum/recurring-repeat-choice.enum';
import { RecurringSeriesFormSelector } from '../recurring-series-form-screen/recurring-series-form.selector';

interface Props {
    readonly choice: RecurringRepeatChoiceEnum;
    readonly isSelected: boolean;
    readonly onSelect: (choice: RecurringRepeatChoiceEnum) => void;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

const chipVariants = cva('min-h-[36px] justify-center rounded-full px-xl active:opacity-70', {
    variants: { isSelected: { true: 'bg-cta-background', false: 'border border-surface-separator bg-surface-fill' } }
});

const labelVariants = cva('text-[15px] font-medium', {
    variants: { isSelected: { true: 'text-cta-foreground', false: 'text-primary' } }
});

export const RecurringFormRepeatChip = ({ choice, isSelected, onSelect }: Props) => {
    const { t } = useLingui();
    const labels: Record<RecurringRepeatChoiceEnum, string> = {
        [RecurringRepeatChoiceEnum.WEEKLY]: t`Weekly`,
        [RecurringRepeatChoiceEnum.BIWEEKLY]: t`Every 2 weeks`,
        [RecurringRepeatChoiceEnum.MONTHLY]: t`Monthly`,
        [RecurringRepeatChoiceEnum.QUARTERLY]: t`Quarterly`,
        [RecurringRepeatChoiceEnum.YEARLY]: t`Yearly`,
        [RecurringRepeatChoiceEnum.CUSTOM]: t`Custom`
    };
    const accessibilityState = { selected: isSelected };

    const handlePress = () => void onSelect(choice);

    return (
        <HapticPressable
            accessibilityRole="button"
            accessibilityState={accessibilityState}
            className={chipVariants({ isSelected })}
            style={CONTINUOUS_CORNERS}
            testID={RecurringSeriesFormSelector.Repeat(choice)}
            onPress={handlePress}
        >
            <Text className={labelVariants({ isSelected })}>{labels[choice]}</Text>
        </HapticPressable>
    );
};
