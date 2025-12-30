import { useLingui } from '@lingui/react/macro';
import React, { useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

import { DatePickerBottomSheet } from '../../../@generic/component/date-picker-bottom-sheet/date-picker-bottom-sheet';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';

interface Props {
    readonly date: Date | null;
    readonly variant: ColorPaletteVariant;
    readonly onChange: (date: Date) => void;
}

export const AccountFormDatePicker = ({ date, onChange, variant }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const { formatDayAndFullMonthAndYear } = useFormatDate();
    const { t } = useLingui();

    const handleOpen = () => void ref.current?.open();

    const description = isDefined(date) ? t`Expected return date` : t`When should it be returned?`;
    const title = isDefined(date) ? formatDayAndFullMonthAndYear(date) : t`Set Return Date`;
    const iconParams = { variant };

    return (
        <>
            <SimpleHorizontalCell iconParams={iconParams} onPress={handleOpen} title={title} description={description} icon="Calendar" />

            <DatePickerBottomSheet ref={ref} date={date} variant={variant} onChange={onChange} />
        </>
    );
};
