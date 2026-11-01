import { useLingui } from '@lingui/react/macro';

import { AnalyticsPageSelector } from '../../../app/(tabs)/analytics-page.selector';
import { AnalyticsTabType } from '../../type/analytics-tab.type';
import { SegmentedControl } from '../segmented-control/segmented-control';

interface Props {
    readonly activeTab: AnalyticsTabType;
    readonly onChangeTab: (tab: AnalyticsTabType) => void;
}

export const AnalyticsSegmentedControl = ({ activeTab, onChangeTab }: Props) => {
    const { t } = useLingui();

    const segments = [
        { value: 'categories' as const, label: t`Categories`, testID: AnalyticsPageSelector.CategoriesTab },
        { value: 'tags' as const, label: t`Tags`, testID: AnalyticsPageSelector.TagsTab },
        { value: 'runway' as const, label: t`Runway`, testID: AnalyticsPageSelector.RunwayTab }
    ];

    return <SegmentedControl segments={segments} value={activeTab} onChange={onChangeTab} />;
};
