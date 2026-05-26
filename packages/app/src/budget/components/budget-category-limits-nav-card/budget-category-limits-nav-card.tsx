import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { useFormContext, useWatch } from 'react-hook-form';

import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';

const handlePress = () => void router.push('/budget/edit/category-limits');

export const BudgetCategoryLimitsNavCard = () => {
    const { t } = useLingui();
    const { control } = useFormContext<BudgetFormValues>();
    const categoryLimits = useWatch<BudgetFormValues, 'categoryLimits'>({ control, name: 'categoryLimits' });

    const count = categoryLimits.length;
    const description = count > 0 ? t`${count} configured` : t`No limits configured`;

    return <SimpleHorizontalCell title={t`Category limits`} description={description} onPress={handlePress} />;
};
