import { Trans } from '@lingui/react/macro';

import { AnalyticsPageSelector } from '../../../app/(tabs)/analytics-page.selector';
import { AnalyticsTabType } from '../../type/analytics-tab.type';
import { AnimatedTabBar } from '../animated-tab-bar/animated-tab-bar';

interface Props {
    readonly activeTab: AnalyticsTabType;
    readonly onChangeTab: (tab: AnalyticsTabType) => void;
}

export const AnalyticsPageHeader = ({ activeTab, onChangeTab }: Props) => {
    const tabs = [
        { key: 'categories', label: <Trans>Categories</Trans>, testID: AnalyticsPageSelector.CategoriesTab },
        { key: 'tags', label: <Trans>Tags</Trans>, testID: AnalyticsPageSelector.TagsTab }
    ] as const;

    return <AnimatedTabBar tabs={tabs} activeTab={activeTab} onChangeTab={onChangeTab} />;
};
