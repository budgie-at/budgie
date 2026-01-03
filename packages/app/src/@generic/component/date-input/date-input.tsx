import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { useRef } from 'react';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { DatePickerBottomSheet } from '../date-picker-bottom-sheet/date-picker-bottom-sheet';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

interface Props {
    readonly value: Date | null;
    readonly onChange: (date: Date) => void;
    readonly placeholder?: string;
}

const textVariants = cva('', {
    variants: {
        isSelected: {
            true: 'text-primary',
            false: 'text-secondary-foreground'
        }
    }
});

const formatDate = (date: Date) => date.toLocaleDateString();

export const DateInput = ({ value, onChange, placeholder }: Props) => {
    const { t } = useLingui();
    const ref = useRef<BottomSheetInterface | null>(null);

    const handlePress = () => ref.current?.open();

    const displayValue = isDefined(value) ? formatDate(value) : (placeholder ?? t`Select date`);

    return (
        <>
            <HapticPressable
                onPress={handlePress}
                className="flex-row items-center justify-between bg-secondary-background border border-secondary-corner rounded-xl px-4 py-3"
            >
                <Text className={textVariants({ isSelected: isDefined(value) })}>{displayValue}</Text>
                <Icon icon={UserIconNameEnum.Calendar} size={20} className="text-secondary-foreground" />
            </HapticPressable>

            <DatePickerBottomSheet ref={ref} date={value ?? new Date()} variant="default" onChange={onChange} />
        </>
    );
};
