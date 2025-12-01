import { useRef } from 'react';

import { DatePickerBottomSheet } from '../../../@generic/components/date-picker-bottom-sheet/date-picker-bottom-sheet';
import { DatePickerCard } from '../../../@generic/components/date-picker-card/date-picker-card';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props {
    readonly date: Date;
    readonly variant: ColorPaletteVariant;
    readonly onChange: (date: Date) => void;
}

export const TransactionFormDatePicker = ({ date, onChange, variant }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);

    const handleOpen = () => void ref.current?.open();

    return (
        <>
            <DatePickerCard onPress={handleOpen} date={date} variant={variant} />

            <DatePickerBottomSheet ref={ref} date={date} variant={variant} onChange={onChange} />
        </>
    );
};
