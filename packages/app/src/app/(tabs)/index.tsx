import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { Page } from '../../@generic/components/page/page';

export default function HomePage() {
    const { t } = useLingui();

    return (
        <Page>
            <Text className="text-text-primary">{t`Home Screen`}</Text>
        </Page>
    );
}
