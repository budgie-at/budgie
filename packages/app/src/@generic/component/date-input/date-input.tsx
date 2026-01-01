/* eslint-disable @rnw-community/no-complex-jsx-logic */
import { useLingui } from '@lingui/react/macro';
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

export const DateInput = ({ value, onChange, placeholder }: Props) => {
    const { t } = useLingui();
    const ref = useRef<BottomSheetInterface>(null);

    const handlePress = () => ref.current?.open();

    const formatDate = (date: Date) => date.toLocaleDateString();

    const displayValue = isDefined(value) ? formatDate(value) : placeholder ?? t`Select date`;

    return (
        <>
            <HapticPressable
                onPress={handlePress}
                className="flex-row items-center justify-between bg-secondary-background border border-secondary-corner rounded-xl px-4 py-3"
            >
                <Text className={isDefined(value) ? 'text-primary' : 'text-secondary-foreground'}>{displayValue}</Text>
                <Icon icon="Calendar" size={20} className="text-secondary-foreground" />
            </HapticPressable>

            <DatePickerBottomSheet ref={ref} date={value ?? new Date()} variant="default" onChange={onChange} />
        </>
    );
};


