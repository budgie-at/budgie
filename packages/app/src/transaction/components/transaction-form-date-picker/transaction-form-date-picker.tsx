import { useRef } from 'react';
import { Text } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { DatePickerBottomSheet } from '../../../@generic/component/date-picker-bottom-sheet/date-picker-bottom-sheet';
import { Icon } from '../../../@generic/component/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';

interface Props {
    readonly date: Date;
    readonly variant: ColorPaletteVariant;
    readonly onChange: (date: Date) => void;
}

export const TransactionFormDatePicker = ({ date, onChange, variant }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const { formatDayAndMonthAndYear } = useFormatDate();

    const handleOpen = () => void ref.current?.open();

    return (
        <>
            <Card onPress={handleOpen} className="flex-row items-center gap-x-lg">
                <Icon icon={ICONS.Calendar} className="text-primary" size={16} />

                <Text className="text-primary">{formatDayAndMonthAndYear(date)}</Text>
            </Card>

            <DatePickerBottomSheet ref={ref} date={date} variant={variant} onChange={onChange} />
        </>
    );
};
