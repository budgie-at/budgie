import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';

export const ApplePayCaptureHistoryNotice = () => (
    <Card variant="secondary" size="md" className="flex-row items-start gap-x-xl">
        <CircleIcon icon={UserIconNameEnum.Info} variant="ghost" size={36} iconSize={18} radius={18} />
        <View className="flex-1 gap-y-xs">
            <Text className="text-primary text-sm font-semibold">
                <Trans>Only new taps</Trans>
            </Text>
            <Text className="text-secondary-foreground text-sm">
                <Trans>Captures new eligible Apple Pay taps. It cannot import Wallet history or final bank settlement changes.</Trans>
            </Text>
        </View>
    </Card>
);
