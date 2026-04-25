import { Trans } from '@lingui/react/macro';

import { AnalyticsPageSelector } from '../../../app/(tabs)/analytics-page.selector';
import { AnalyticsTabType } from '../../type/analytics-tab.type';
import { AnimatedTabBar } from '../animated-tab-bar/animated-tab-bar';

import type { TabConfigInterface } from '../../interface/tab-config.interface';

interface Props {
    readonly activeTab: AnalyticsTabType;
    readonly onChangeTab: (tab: AnalyticsTabType) => void;
}

const TABS: readonly TabConfigInterface<AnalyticsTabType>[] = [
    { key: 'categories', label: <Trans>Categories</Trans>, testID: AnalyticsPageSelector.CategoriesTab },
    { key: 'tags', label: <Trans>Tags</Trans>, testID: AnalyticsPageSelector.TagsTab }
];

export const AnalyticsPageHeader = ({ activeTab, onChangeTab }: Props) => (
    <AnimatedTabBar tabs={TABS} activeTab={activeTab} onChangeTab={onChangeTab} />
);
