import { View } from 'react-native';

import { SimpleQuickFormSelector } from '../simple-quick-form/simple-quick-form.selector';
import { TransactionFormActions } from '../transaction-form-actions/transaction-form-actions';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly label: string;
    readonly isDisabled: boolean;
    readonly onConfirm: () => void;
}

export const ConvertTransferFooter = ({ children, label, isDisabled, onConfirm }: Props) => (
    <View className="gap-y-[8px]">
        {children}
        <TransactionFormActions label={label} isDisabled={isDisabled} onConfirm={onConfirm} testID={SimpleQuickFormSelector.SubmitButton} />
    </View>
);
