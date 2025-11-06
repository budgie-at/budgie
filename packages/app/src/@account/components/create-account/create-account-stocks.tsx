import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { Page } from '../../../@generic/components/page/page';

export const CreateAccountStocks = () => {
    const { t } = useLingui();

    return (
        <Page>
            <Text>{t`CreateAccountStocks`}</Text>
        </Page>
    );
};
