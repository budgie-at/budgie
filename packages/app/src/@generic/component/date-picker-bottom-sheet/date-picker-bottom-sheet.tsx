import { Trans } from '@lingui/react/macro';
import { RefObject, useState } from 'react';
import { Text, View } from 'react-native';

import { ICONS } from '../../constant/icons.constant';
import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { BottomSheet } from '../bottom-sheet/bottom-sheet';
import { BottomSheetFormFooter } from '../bottom-sheet-form-footer/bottom-sheet-form-footer';
import { BottomSheetView } from '../bottom-sheet-view/bottom-sheet-view';
import { CircleIcon } from '../circle-icon/circle-icon';
import { SingleDatePicker } from '../date-picker/single-date-picker';
import { isDefined } from '@rnw-community/shared';

interface Props {
    readonly date: Date | null;
    readonly variant: ColorPaletteVariant;
    readonly onChange: (date: Date) => void;
    readonly ref: RefObject<BottomSheetInterface | null>;
}

export const DatePickerBottomSheet = ({ date, onChange, ref }: Props) => {
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
                <View className="flex-row items-center gap-x-xl px-5xl border-b border-b-secondary-corner pb-3xl">
                    <CircleIcon size="1_25xl" variant="ghost" icon={ICONS.Calendar} />

                    <Text className="text-primary font-semibold">
                        <Trans>Select Date</Trans>
                    </Text>
                </View>

                <SingleDatePicker date={localDate} onChange={setLocalDate} />

                <BottomSheetFormFooter onCancel={handleCancel} onSubmit={handleSubmit} />
            </BottomSheetView>
        </BottomSheet>
    );
};
