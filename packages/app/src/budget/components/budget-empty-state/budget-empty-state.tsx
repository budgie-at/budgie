import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { BudgetTemplateOptionCard } from '../budget-template-option-card/budget-template-option-card';

const handleNavigate = () => void router.push('/budget/create');

interface Props {
    readonly testID?: string;
}

export const BudgetEmptyState = ({ testID }: Props) => {
    const { t } = useLingui();

    return (
        <BudgetTemplateOptionCard
            testID={testID}
            icon={UserIconNameEnum.ChartPie}
            title={t`Know what’s safe to spend`}
            description={t`Set a limit and get a daily allowance`}
            onPress={handleNavigate}
        />
    );
};
