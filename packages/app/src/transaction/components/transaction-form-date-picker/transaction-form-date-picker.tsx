import { useRef } from 'react';
import { DatePickerBottomSheet } from '../../../@generic/component/date-picker-bottom-sheet/date-picker-bottom-sheet';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';

interface Props {
    readonly date: Date;
    readonly variant: ColorPaletteVariant;
    readonly onChange: (date: Date) => void;
}

const iconParams = { variant: 'ghost', size: 16, iconSize: 16, border: false } as const;

export const TransactionFormDatePicker = ({ date, onChange, variant }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const { formatDayAndMonthAndYear } = useFormatDate();

    const handleOpen = () => void ref.current?.open();

    return (
        <>
            <SimpleHorizontalCell
                size="lg"
                right={null}
                icon="Calendar"
                onPress={handleOpen}
                iconParams={iconParams}
                title={formatDayAndMonthAndYear(date)}
            />

            <DatePickerBottomSheet ref={ref} date={date} variant={variant} onChange={onChange} />
        </>
    );
};
