import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

export const ApplePayCaptureHistoryNotice = () => (
    <Text className="text-secondary-foreground px-3xl pt-md text-[13px] leading-[18px]">
        <Trans>
            Only new taps. Captures new eligible Apple Pay taps. It cannot import Wallet history or final bank settlement changes.
        </Trans>
    </Text>
);
