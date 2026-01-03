import { BudgetEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { useRef } from 'react';
import Toast from 'react-native-toast-message';

import { ConfirmActionBottomSheet } from '../../../@generic/component/confirm-action-bottom-sheet/confirm-action-bottom-sheet';
import { budgetRepository } from '../../../@generic/drizzle/db/db';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { BudgetListItem } from '../../../budget/component/budget-list-item/budget-list-item';
import { budgetService } from '../../../budget/service/budget.service';

interface Props {
    readonly budget: BudgetEntityInterface;
}

export const BudgetListItemWrapper = ({ budget }: Props) => {
    const { t } = useLingui();
    const deleteRef = useRef<BottomSheetInterface | null>(null);

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

    return (
        <>
            <BudgetListItem budget={budget} onPress={handlePress} onActivate={handleActivate} onDelete={handleDeletePress} />

            <ConfirmActionBottomSheet
                ref={deleteRef}
                variant="destructive"
                icon={UserIconNameEnum.Trash2}
                title={t`Delete Budget?`}
                description={t`This will permanently delete this budget and all its allocations. This action cannot be undone.`}
                buttonText={t`Delete`}
                onSubmit={handleDelete}
            />
        </>
    );
};

