import { BudgetEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { useRef } from 'react';
import Toast from 'react-native-toast-message';

import { ConfirmActionBottomSheet } from '../../../@generic/component/confirm-action-bottom-sheet/confirm-action-bottom-sheet';
import { InputActionBottomSheet } from '../../../@generic/component/input-action-bottom-sheet/input-action-bottom-sheet';
import { budgetRepository } from '../../../@generic/drizzle/db/db';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { BudgetListItem } from '../budget-list-item/budget-list-item';
import { budgetService } from '../../service/budget.service';

interface Props {
    readonly budget: BudgetEntityInterface;
}

export const BudgetListItemWrapper = ({ budget }: Props) => {
    const { t } = useLingui();
    const deleteRef = useRef<BottomSheetInterface | null>(null);
    const cloneRef = useRef<BottomSheetInterface | null>(null);

    const handlePress = () => void router.push(`/budget/${budget.id}`);

    const handleActivate = () => {
        void budgetService.activateBudget(budget.id).catch(() => {
            Toast.show({ type: 'error', text1: t`Error`, text2: t`Failed to activate budget` });
        });
    };

    const handleDeletePress = () => void deleteRef.current?.open();

    const handleDelete = async () => {
        try {
            await budgetRepository.deleteById(budget.id);
            deleteRef.current?.close();
        } catch {
            Toast.show({ type: 'error', text1: t`Error`, text2: t`Failed to delete budget` });
        }
    };

    const handleClonePress = () => void cloneRef.current?.open();

    const handleClone = async (newTitle: string) => {
        try {
            await budgetService.cloneBudget(budget.id, newTitle);
            cloneRef.current?.close();
        } catch {
            Toast.show({ type: 'error', text1: t`Error`, text2: t`Failed to clone budget` });
        }
    };

    return (
        <>
            <BudgetListItem
                budget={budget}
                onPress={handlePress}
                onActivate={handleActivate}
                onDelete={handleDeletePress}
                onClone={handleClonePress}
            />

            <ConfirmActionBottomSheet
                ref={deleteRef}
                variant="destructive"
                icon={UserIconNameEnum.Trash2}
                title={t`Delete Budget?`}
                description={t`This will permanently delete this budget and all its allocations. This action cannot be undone.`}
                buttonText={t`Delete`}
                onSubmit={handleDelete}
            />

            <InputActionBottomSheet
                ref={cloneRef}
                variant="primary"
                icon={UserIconNameEnum.Copy}
                title={t`Clone Budget`}
                description={t`Create a copy of this budget with all its allocations.`}
                buttonText={t`Clone`}
                placeholder={t`New budget name`}
                defaultValue={`${budget.title} (Copy)`}
                onSubmit={handleClone}
            />
        </>
    );
};

