import { useLingui } from '@lingui/react/macro';
import { RefObject, useEffect, useState } from 'react';
import { View } from 'react-native';

import { BottomSheet } from '../../../@generic/component/bottom-sheet/bottom-sheet';
import { BottomSheetFormFooter } from '../../../@generic/component/bottom-sheet-form-footer/bottom-sheet-form-footer';
import { BottomSheetHeader } from '../../../@generic/component/bottom-sheet-header/bottom-sheet-header';
import { BottomSheetScrollView } from '../../../@generic/component/bottom-sheet-scroll-view/bottom-sheet-scroll-view';
import { BottomSheetTextInput } from '../../../@generic/component/bottom-sheet-text-input/bottom-sheet-text-input';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';

interface Props {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly title: string;
    readonly value: number;
    readonly onSave: (value: number) => void;
}

export const BudgetThresholdBottomSheet = ({ ref, title, value, onSave }: Props) => {
    const { t } = useLingui();

    const [threshold, setThreshold] = useState(String(value));

    useEffect(() => {
        setThreshold(String(value));
    }, [value]);

    const handleCancel = () => {
        setThreshold(String(value));
        void ref.current?.close();
    };

    const handleDismiss = () => {
        setThreshold(String(value));
    };

    const handleChangeText = (text: string) => {
        const numericValue = text.replace(/[^0-9]/gu, '');
        const parsed = parseInt(numericValue, 10);

        if (isNaN(parsed)) {
            setThreshold('');

            return;
        }

        const clamped = Math.min(Math.max(parsed, 0), 200);
        setThreshold(String(clamped));
    };

    const handleSave = () => {
        const parsed = parseInt(threshold, 10);
        onSave(isNaN(parsed) ? value : parsed);
        void ref.current?.close();
    };

    return (
        <BottomSheet enableDynamicSizing onDismiss={handleDismiss} ref={ref}>
            <BottomSheetScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View className="px-7xl py-5xl">
                    <View className="mb-10">
                        <BottomSheetHeader size="lg" align="center" title={title} />
                    </View>

                    <BottomSheetTextInput
                        value={threshold}
                        onChangeText={handleChangeText}
                        keyboardType="number-pad"
                        autoFocus
                        size="lg"
                        className="text-center"
                    />
                </View>

                <BottomSheetFormFooter onCancel={handleCancel} onSubmit={handleSave} submitLabel={t`Save`} />
            </BottomSheetScrollView>
        </BottomSheet>
    );
};
