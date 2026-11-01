import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { Button } from '../../../@generic/component/button/button';
import { StatsEmptyCard } from '../../../@generic/component/stats-empty-card/stats-empty-card';
import { AnalyticsPageSelector } from '../../../app/(tabs)/analytics-page.selector';

export const TagsFeatureIntro = () => {
    const { t } = useLingui();

    const handleOpenTransactions = () => void router.push('/transactions');

    return (
        <StatsEmptyCard
            testID={AnalyticsPageSelector.TagsEmptyState}
            icon={UserIconNameEnum.Tags}
            title={t`See spending by context, not just category`}
            description={t`Tags cut across categories — track a trip, a project or a person and see the true total.`}
        >
            <Button onPress={handleOpenTransactions} leftIcon={UserIconNameEnum.Plus} content={t`Tag a transaction`} />
        </StatsEmptyCard>
    );
};
