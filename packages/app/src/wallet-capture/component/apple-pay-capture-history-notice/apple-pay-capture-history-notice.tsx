import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { Card } from '../../../@generic/component/card/card';

export const ApplePayCaptureHistoryNotice = () => (
    <Card variant="dark-warning" className="gap-y-sm">
        <Text className="text-primary text-base font-semibold">
            <Trans>Wallet history is not available</Trans>
        </Text>
        <Text className="text-secondary-foreground text-sm">
            <Trans>Captures new eligible Apple Pay taps. It cannot import Wallet history or final bank settlement changes.</Trans>
        </Text>
    </Card>
);
