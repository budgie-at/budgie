import { TransactionCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { BottomSheetFormFooter } from '../../../@generic/component/bottom-sheet-form-footer/bottom-sheet-form-footer';
import { SingleDatePicker } from '../../../@generic/component/date-picker/single-date-picker';
import { FormSheetHeader } from '../../../@generic/component/form-sheet-header/form-sheet-header';

interface Props {
    readonly onClose: () => void;
}

export const TransactionFormDatePickerEmbedded = ({ onClose }: Props) => {
    const { t } = useLingui();
    const { control, setValue } = useFormContext<TransactionCreateInputInterface>();
    const operatedAt = useWatch({ control, name: 'operatedAt' });

    const handleDateChange = (newDate: Date) => {
        setValue('operatedAt', newDate);
    };

    return (
        <View className="flex-1">
            <FormSheetHeader>{t`Select Date`}</FormSheetHeader>

            <SingleDatePicker date={operatedAt} onChange={handleDateChange} />

            <BottomSheetFormFooter onCancel={onClose} onSubmit={onClose} submitLabel={t`Done`} />
        </View>
    );
};
