import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { FeatureIntro } from '../../../@generic/component/feature-intro/feature-intro';
import { AnalyticsPageSelector } from '../../../app/(tabs)/analytics-page.selector';

export const CategoriesFeatureIntro = () => {
    const { t } = useLingui();

    const handleAddTransaction = () => void router.push('/create-transaction/expense');

    return (
        <FeatureIntro
            testID={AnalyticsPageSelector.CategoriesEmptyState}
            icon={UserIconNameEnum.Folder}
            title={t`No spending in this period`}
            description={t`Categories break your spending down automatically. Add a transaction, or widen the period to see earlier ones.`}
            buttonText={t`Add a transaction`}
            onCreate={handleAddTransaction}
        />
    );
};
