import { useLingui } from '@lingui/react/macro';
import { RefObject, useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { BottomSheet } from '../bottom-sheet/bottom-sheet';
import { BottomSheetFormFooter } from '../bottom-sheet-form-footer/bottom-sheet-form-footer';
import { BottomSheetHeader } from '../bottom-sheet-header/bottom-sheet-header';
import { BottomSheetView } from '../bottom-sheet-view/bottom-sheet-view';
import { SingleDatePicker } from '../date-picker/single-date-picker';

interface Props {
    readonly date: Date | null;
    readonly variant: ColorPaletteVariant;
    readonly onChange: (date: Date) => void;
    readonly ref: RefObject<BottomSheetInterface | null>;
}

export const DatePickerBottomSheet = ({ date, onChange, ref }: Props) => {
    const { t } = useLingui();

    const [localDate, setLocalDate] = useState<Date | null>(date);

    const handleSubmit = () => {
        if (isDefined(localDate)) {
            void onChange(localDate);
        }
        ref.current?.close();
    };

    const handleCancel = () => {
        setLocalDate(date);
        ref.current?.close();
    };

    return (
        <BottomSheet enableDynamicSizing ref={ref}>
            <BottomSheetView>
                <BottomSheetHeader size="md" title={t`Select Date`} description={t`Choose a date for your transaction`} />

                <SingleDatePicker date={localDate} onChange={setLocalDate} />

                <BottomSheetFormFooter onCancel={handleCancel} onSubmit={handleSubmit} />
            </BottomSheetView>
        </BottomSheet>
    );
};
