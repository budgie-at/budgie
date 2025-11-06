import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { Page } from '../../../@generic/components/page/page';

export const CreateAccountCash = () => {
    const { t } = useLingui();

    return (
        <Page>
            <Text>{t`CreateAccountCash`}</Text>
        </Page>
    );
};
