import { Trans } from '@lingui/react/macro';
import { View } from 'react-native';

import { AnalyticsPageSelector } from '../../../app/(tabs)/analytics-page.selector';
import { AnalyticsTabType } from '../../type/analytics-tab.type';
import { AnimatedTabBar } from '../animated-tab-bar/animated-tab-bar';

import type { TabConfigInterface } from '../../interface/tab-config.interface';
import type { Ref } from 'react';

interface Props {
    readonly activeTab: AnalyticsTabType;
    readonly onChangeTab: (tab: AnalyticsTabType) => void;
    readonly ref: Ref<View>;
    readonly onLayout: () => void;
}

const TABS: readonly TabConfigInterface<AnalyticsTabType>[] = [
    { key: 'categories', label: <Trans>Categories</Trans>, testID: AnalyticsPageSelector.CategoriesTab },
    { key: 'tags', label: <Trans>Tags</Trans>, testID: AnalyticsPageSelector.TagsTab },
    { key: 'runway', label: <Trans>Runway</Trans>, testID: AnalyticsPageSelector.RunwayTab }
];

export const AnalyticsPageHeader = ({ activeTab, onChangeTab, ref, onLayout }: Props) => (
    <View ref={ref} className="pb-5xl" pointerEvents="box-none" onLayout={onLayout}>
        <AnimatedTabBar tabs={TABS} activeTab={activeTab} onChangeTab={onChangeTab} />
    </View>
);
