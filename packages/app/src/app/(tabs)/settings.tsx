import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { Page } from '../../@generic/components/page/page';

export default function SettingsPage() {
    const { t } = useLingui();

    return (
        <Page>
            <Text className="text-text-primary">{t`Settings Page`}</Text>
        </Page>
    );
}
