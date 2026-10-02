import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { FeatureIntro } from '../../../@generic/component/feature-intro/feature-intro';
import { AnalyticsPageSelector } from '../../../app/(tabs)/analytics-page.selector';

export const TagsFeatureIntro = () => {
    const { t } = useLingui();

    const handleOpenTransactions = () => void router.push('/transactions');

    return (
        <FeatureIntro
            testID={AnalyticsPageSelector.TagsEmptyState}
            icon={UserIconNameEnum.Tags}
            title={t`See spending by context, not just category`}
            description={t`Tags cut across categories — track a trip, a project or a person and see the true total.`}
            buttonText={t`Tag a transaction`}
            onCreate={handleOpenTransactions}
        />
    );
};
