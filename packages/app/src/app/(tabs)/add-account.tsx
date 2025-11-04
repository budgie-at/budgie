import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { Page } from '../../@generic/components/page/page';

export default function AddAccountPage() {
    const { t } = useLingui();

    return (
        <Page>
            <Text className="text-primary">{t`AddAccount Page`}</Text>
        </Page>
    );
}
