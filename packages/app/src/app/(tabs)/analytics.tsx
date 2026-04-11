import { useLingui } from '@lingui/react/macro';

import { Page } from '../../@generic/component/page/page';
import { PageHeader } from '../../@generic/component/page-header/page-header';
import { StatisticsContent } from '../../transaction/components/statistics-content/statistics-content';

import { AnalyticsPageSelector } from './analytics-page.selector';

export default function AnalyticsPage() {
    const { t } = useLingui();

    return (
        <Page testID={AnalyticsPageSelector.Container} header={<PageHeader className="border-b-0" size="md" title={t`Statistics`} />}>
            <StatisticsContent />
        </Page>
    );
}
