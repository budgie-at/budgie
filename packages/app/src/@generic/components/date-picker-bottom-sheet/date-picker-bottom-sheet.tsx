import { Trans } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { useRef } from 'react';
import { Text, View } from 'react-native';

import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { ICONS } from '../../constant/icons.constant';
import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { BottomSheet } from '../bottom-sheet/bottom-sheet';
import { BottomSheetView } from '../bottom-sheet-view/bottom-sheet-view';
import { Card } from '../card/card';
import { CircleIcon } from '../circle-icon/circle-icon';
import { DatePicker } from '../date-picker/date-picker';
import { FormBottomSheetFooter } from '../form-bottom-sheet-footer/form-bottom-sheet-footer';
import { Icon } from '../icon/icon';

interface Props {
    readonly date: Date;
    readonly variant: ColorPaletteVariant;
    readonly onChange: (date: Date) => void;
}

const iconVariants = cva('', {
    variants: {
        variant: FOREGROUND_COLOR_PALETTE
    }
});

export const DatePickerBottomSheet = ({ date, onChange, variant }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);

    const handleOpen = () => void ref.current?.open();
    const handleCancel = () => void ref.current?.close();

    return (
        <>
            <Card onPress={handleOpen} className="flex-row items-center gap-x-xl">
                <Icon icon={ICONS.Calendar} size={16} className={iconVariants({ variant })} />

                <Text className="text-sm font-medium text-primary">{date.toLocaleDateString()}</Text>
            </Card>

            <BottomSheet ref={ref}>
                <BottomSheetView>
                    <View className="flex-row items-center gap-x-xl px-5xl border-b border-b-secondary-corner pb-3xl">
                        <CircleIcon size="1_25xl" variant="ghost" icon={ICONS.Calendar} />

                        <Text className="text-primary font-semibold">
                            <Trans>Select Date</Trans>
                        </Text>
                    </View>

                    <DatePicker date={date} onChange={onChange} />

                    <FormBottomSheetFooter onCancel={handleCancel} onSubmit={handleCancel} />
                </BottomSheetView>
            </BottomSheet>
        </>
    );
};
