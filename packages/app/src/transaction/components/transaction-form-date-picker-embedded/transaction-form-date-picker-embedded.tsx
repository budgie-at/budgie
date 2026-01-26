import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { BottomSheetFormFooter } from '../../../@generic/component/bottom-sheet-form-footer/bottom-sheet-form-footer';
import { SingleDatePicker } from '../../../@generic/component/date-picker/single-date-picker';
import { FormSheetHeader } from '../../../@generic/component/form-sheet-header/form-sheet-header';

interface Props {
    readonly value: Date;
    readonly onChange: (date: Date) => void;
    readonly onClose: () => void;
}

export const TransactionFormDatePickerEmbedded = ({ value, onChange, onClose }: Props) => {
    const { t } = useLingui();

    return (
        <View className="flex-1">
            <FormSheetHeader>{t`Select Date`}</FormSheetHeader>

            <SingleDatePicker date={value} onChange={onChange} />

            <BottomSheetFormFooter onCancel={onClose} onSubmit={onClose} submitLabel={t`Done`} />
        </View>
    );
};
