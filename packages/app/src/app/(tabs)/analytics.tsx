import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { Page } from '../../@generic/components/page/page';

export default function AnalyticsPage() {
    const { t } = useLingui();

    return (
        <Page>
            <Text style={{color: '#ffffff'}}>{t`Analytics Page`}</Text>
        </Page>
    );
}
