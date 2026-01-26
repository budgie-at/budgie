import { UserIconNameEnum } from '@budgie/contracts';
import { useRef } from 'react';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
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

export const TransactionFormDatePickerStandalone = ({ date, onChange, variant }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const { formatDayAndMonthAndYear } = useFormatDate();

    const handleOpen = () => void ref.current?.open();

    return (
        <>
            <SimpleHorizontalCell
                size="md"
                right={null}
                left={<CircleIcon icon={UserIconNameEnum.Calendar} variant="ghost" size={16} iconSize={16} border={false} />}
                onPress={handleOpen}
                title={formatDayAndMonthAndYear(date)}
                singleLine
            />

            <DatePickerBottomSheet ref={ref} date={date} variant={variant} onChange={onChange} />
        </>
    );
};
