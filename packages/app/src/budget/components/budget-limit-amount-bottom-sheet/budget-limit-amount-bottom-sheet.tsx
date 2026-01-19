import { useLingui } from '@lingui/react/macro';
import { RefObject, useState } from 'react';
import { View } from 'react-native';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { BottomSheet } from '../../../@generic/component/bottom-sheet/bottom-sheet';
import { BottomSheetFormFooter } from '../../../@generic/component/bottom-sheet-form-footer/bottom-sheet-form-footer';
import { BottomSheetHeader } from '../../../@generic/component/bottom-sheet-header/bottom-sheet-header';
import { BottomSheetScrollView } from '../../../@generic/component/bottom-sheet-scroll-view/bottom-sheet-scroll-view';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';

interface Props {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly title: string;
    readonly value: number;
    readonly onSave: (value: number) => void;
}

export const BudgetLimitAmountBottomSheet = ({ ref, title, value, onSave }: Props) => {
    const { t } = useLingui();

    const [amount, setAmount] = useState(value);

    const handleCancel = () => {
        setAmount(value);
        void ref.current?.close();
    };

    const handleDismiss = () => {
        setAmount(value);
    };

    const handleSave = () => {
        onSave(amount);
        void ref.current?.close();
    };

    return (
        <BottomSheet enableDynamicSizing onDismiss={handleDismiss} ref={ref}>
            <BottomSheetScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View className="px-7xl py-5xl">
                    <View className="mb-10">
                        <BottomSheetHeader size="lg" align="center" title={title} />
                    </View>

                    <AmountInput value={amount} onChangeValue={setAmount} autoFocus />
                </View>

                <BottomSheetFormFooter onCancel={handleCancel} onSubmit={handleSave} submitLabel={t`Save`} />
            </BottomSheetScrollView>
        </BottomSheet>
    );
};
