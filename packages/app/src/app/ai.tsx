import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { Page } from '../@generic/components/page/page';

export default function AiScreen() {
    return (
        <Page>
            <Text className="text-primary text-3xl font-semibold">
                <Trans>AI chat</Trans>
            </Text>
        </Page>
    );
}
