import { ReactNode } from 'react';
import { View } from 'react-native';

import { ModalFormSaveButton } from '../../../@generic/component/modal-form-save-button/modal-form-save-button';
import { BudgetSelector } from '../../budget.selector';
import { BudgetAllocationSummary } from '../budget-allocation-summary/budget-allocation-summary';

interface Props {
    readonly onSubmit: () => void;
    readonly disabled: boolean;
    readonly deleteButton: ReactNode;
}

export const BudgetEditFooter = ({ onSubmit, disabled, deleteButton }: Props) => (
    <View className="gap-y-md">
        <BudgetAllocationSummary />
        <View className="flex-row gap-x-md">
            {deleteButton}
            <ModalFormSaveButton testID={BudgetSelector.SetupSaveButton} onPress={onSubmit} disabled={disabled} />
        </View>
    </View>
);
