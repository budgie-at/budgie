import { useLingui } from '@lingui/react/macro';

import { AnalyticsPageSelectors } from '../../@e2e/selectors/analytics-page.selector';
import { Page } from '../../@generic/component/page/page';
import { PageHeader } from '../../@generic/component/page-header/page-header';
import { StatisticsContent } from '../../transaction/components/statistics-content/statistics-content';

export default function AnalyticsPage() {
    const { t } = useLingui();

    return (
        <Page testID={AnalyticsPageSelectors.Container} header={<PageHeader className="border-b-0" size="md" title={t`Statistics`} />}>
            <StatisticsContent />
        </Page>
    );
}
