import { useLingui } from '@lingui/react/macro';

import { Page } from '../../@generic/component/page/page';
import { PageHeader } from '../../@generic/component/page-header/page-header';
import { StatisticsContent } from '../../transaction/components/statistics-content/statistics-content';

export default function AnalyticsPage() {
    const { t } = useLingui();

    return (
        <Page header={<PageHeader size="md" title={t`Statistics`} />}>
            <StatisticsContent />
        </Page>
    );
}
