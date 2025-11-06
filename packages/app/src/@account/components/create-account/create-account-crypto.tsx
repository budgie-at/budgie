import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { Page } from '../../../@generic/components/page/page';

export const CreateAccountCrypto = () => {
    const { t } = useLingui();

    return (
        <Page>
            <Text>{t`CreateAccountCrypto`}</Text>
        </Page>
    );
};
