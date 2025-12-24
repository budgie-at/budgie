import { DatePeriodEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { DATE_PERIOD } from '../../constant/date-period.constant';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';

interface Props {
    readonly isSelected: boolean;
    readonly period: DatePeriodEnum;
    readonly onSelect: (period: DatePeriodEnum) => void;
}

const chipVariants = cva('rounded-2xl border border-secondary-corner px-4xl py-md', {
    variants: {
        isSelected: {
            true: 'bg-primary',
            false: ''
        }
    }
});

const chipTextVariants = cva('font-semibold', {
    variants: {
        isSelected: {
            true: 'text-primary-reverse',
            false: 'text-secondary-foreground'
        }
    }
});

export const DateFilterItem = ({ period, isSelected, onSelect }: Props) => {
    const { i18n } = useLingui();

    const handleSelect = () => void onSelect(period);

    return (
        <HapticPressable className={chipVariants({ isSelected })} onPress={handleSelect}>
            <Text className={chipTextVariants({ isSelected })}>{i18n.t(DATE_PERIOD[period])}</Text>
        </HapticPressable>
    );
};
