import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { Page } from '../../@generic/components/page/page';

export default function AnalyticsPage() {
    return (
        <Page>
            <Text className="text-primary">
                <Trans>Analytics Page</Trans>
            </Text>
        </Page>
    );
}
