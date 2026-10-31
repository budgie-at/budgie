import { useLingui } from '@lingui/react/macro';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { BudgetSelector } from '../../budget.selector';
import { BudgetStartsOnRowContent } from '../budget-starts-on-row-content/budget-starts-on-row-content';

interface Props {
    readonly value: string;
    readonly onPress: () => void;
}

export const BudgetStartsOnRow = ({ value, onPress }: Props) => {
    const { t } = useLingui();
    const title = t`Starts on`;

    return (
        <HapticPressable
            accessibilityLabel={`${title}, ${value}`}
            accessibilityRole="button"
            className="active:opacity-70"
            testID={BudgetSelector.SetupStartsOnRow}
            onPress={onPress}
        >
            <BudgetStartsOnRowContent title={title} value={value} />
        </HapticPressable>
    );
};
