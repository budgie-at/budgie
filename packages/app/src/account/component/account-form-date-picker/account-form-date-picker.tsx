import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

import { DatePickerBottomSheet } from '../../../@generic/component/date-picker-bottom-sheet/date-picker-bottom-sheet';
import { DatePickerCard } from '../../../@generic/component/date-picker-card/date-picker-card';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props {
    readonly date: Date | null;
    readonly variant: ColorPaletteVariant;
    readonly onChange: (date: Date) => void;
}

export const AccountFormDatePicker = ({ date, onChange, variant }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const { t } = useLingui();

    const handleOpen = () => void ref.current?.open();
    const description = isDefined(date) ? t`Expected return date` : t`When should it be returned?`;

    return (
        <>
            <DatePickerCard title={t`Set Return Date`} description={description} onPress={handleOpen} date={date} variant={variant} />

            <DatePickerBottomSheet ref={ref} date={date} variant={variant} onChange={onChange} />
        </>
    );
};
