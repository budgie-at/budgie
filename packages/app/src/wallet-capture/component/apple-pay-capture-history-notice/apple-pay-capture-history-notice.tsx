import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

export const ApplePayCaptureHistoryNotice = () => (
    <Text className="text-secondary-foreground px-3xl pt-md text-[13px] leading-[18px]">
        <Trans>Captures new Apple Pay taps only. It can&apos;t import Wallet history or later bank settlement changes.</Trans>
    </Text>
);
