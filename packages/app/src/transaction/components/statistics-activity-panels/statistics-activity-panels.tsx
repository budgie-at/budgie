import { Activity, useState } from 'react';

import { AnalyticsTabType } from '../../../@generic/type/analytics-tab.type';
import { StatisticsCategoriesActivityContent } from '../statistics-categories-activity-content/statistics-categories-activity-content';
import { StatisticsTagsActivityContent } from '../statistics-tags-activity-content/statistics-tags-activity-content';

import type { TransactionFilterInterface } from '@budgie/contracts';

interface Props {
    readonly activeTab: AnalyticsTabType;
    readonly filters: TransactionFilterInterface;
    readonly income: number;
    readonly expense: number;
}

export const StatisticsActivityPanels = ({ activeTab, filters, income, expense }: Props) => {
    const [visitedTabs, setVisitedTabs] = useState<ReadonlySet<AnalyticsTabType>>(() => new Set([activeTab]));

    if (!visitedTabs.has(activeTab)) {
        setVisitedTabs(new Set([...visitedTabs, activeTab]));
    }

    const isCategoriesTab = activeTab === 'categories';
    const categoriesActivityMode = isCategoriesTab ? 'visible' : 'hidden';
    const tagsActivityMode = isCategoriesTab ? 'hidden' : 'visible';
    const categoriesPanel = visitedTabs.has('categories') ? (
        <Activity mode={categoriesActivityMode}>
            <StatisticsCategoriesActivityContent filters={filters} income={income} expense={expense} />
        </Activity>
    ) : null;
    const tagsPanel = visitedTabs.has('tags') ? (
        <Activity mode={tagsActivityMode}>
            <StatisticsTagsActivityContent filters={filters} income={income} expense={expense} />
        </Activity>
    ) : null;

    return (
        <>
            {categoriesPanel}

            {tagsPanel}
        </>
    );
};
