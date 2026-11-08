import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { View } from 'react-native';

import { DatePickerModalSelector } from '../../../app/date-picker-modal.selector';
import { useMorphingSheetDismiss } from '../../context/morphing-sheet.context';
import { useMorphingSheetCommit } from '../../hook/use-morphing-sheet-commit.hook';
import { SingleDatePicker } from '../date-picker/single-date-picker';
import { SheetHeaderAction } from '../sheet-header-action/sheet-header-action';
import { SheetSurface } from '../sheet-surface/sheet-surface';
import { SheetTitleRow } from '../sheet-title-row/sheet-title-row';

interface Props {
    readonly initialDate: Date;
    readonly onCommit: (date: Date) => void;
}

export const DatePickerSheetContent = ({ initialDate, onCommit }: Props) => {
    const { t } = useLingui();
    const dismiss = useMorphingSheetDismiss();
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const commitDate = useMorphingSheetCommit(onCommit);
    const handleDone = () => void commitDate(selectedDate);

    return (
        <SheetSurface
            className="flex-none pt-lg"
            contentClassName="flex-none"
            header={
                <View className="px-xl">
                    <SheetTitleRow
                        title={t`Date`}
                        onClose={dismiss}
                        trailing={<SheetHeaderAction label={t`Done`} onPress={handleDone} testID={DatePickerModalSelector.Done} />}
                    />
                </View>
            }
        >
            <View className="pb-[16px]">
                <SingleDatePicker date={selectedDate} onChange={setSelectedDate} />
            </View>
        </SheetSurface>
    );
};
