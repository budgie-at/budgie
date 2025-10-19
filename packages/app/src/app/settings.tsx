import { useLingui } from '@lingui/react/macro';

import { Page } from '../@generic/components/page/page';
import { PageHeader } from '../@generic/components/page-header/page-header';

export default function SettingsPage() {
    const { t } = useLingui();

    return (
        <Page>
            <PageHeader title={t`Settings`} />
        </Page>
    );
}
