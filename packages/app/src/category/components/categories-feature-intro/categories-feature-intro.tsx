import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { Button } from '../../../@generic/component/button/button';
import { StatsEmptyCard } from '../../../@generic/component/stats-empty-card/stats-empty-card';
import { AnalyticsPageSelector } from '../../../app/(tabs)/analytics-page.selector';

export const CategoriesFeatureIntro = () => {
    const { t } = useLingui();

    const handleAddTransaction = () => void router.push('/create-transaction/expense');

    return (
        <StatsEmptyCard
            testID={AnalyticsPageSelector.CategoriesEmptyState}
            icon={UserIconNameEnum.Folder}
            title={t`No spending in this period`}
            description={t`Categories break your spending down automatically. Add a transaction, or choose another period.`}
        >
            <Button onPress={handleAddTransaction} leftIcon={UserIconNameEnum.Plus} content={t`Add a transaction`} />
        </StatsEmptyCard>
    );
};
