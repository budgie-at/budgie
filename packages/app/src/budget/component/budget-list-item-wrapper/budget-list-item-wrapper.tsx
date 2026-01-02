import { BudgetEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

import { BudgetListItem } from '../../../budget/component/budget-list-item/budget-list-item';
import { budgetService } from '../../../budget/service/budget.service';

interface Props {
    readonly budget: BudgetEntityInterface;
}

export const BudgetListItemWrapper = ({ budget }: Props) => {
    const { t } = useLingui();

    const handlePress = () => void router.push(`/budget/${budget.id}`);

    const handleActivate = () => {
        void budgetService.activateBudget(budget.id).catch(() => {
            Toast.show({ type: 'error', text1: t`Error`, text2: t`Failed to activate budget` });
        });
    };

    return <BudgetListItem budget={budget} onPress={handlePress} onActivate={handleActivate} />;
};

