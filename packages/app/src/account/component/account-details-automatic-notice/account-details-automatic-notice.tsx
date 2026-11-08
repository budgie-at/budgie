import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { AccountAutomaticPill } from '../account-automatic-pill/account-automatic-pill';

export const AccountDetailsAutomaticNotice = () => (
    <View className="items-center gap-y-md px-xl">
        <AccountAutomaticPill />
        <Text className="text-sm text-secondary-foreground text-center">
            <Trans>
                Budgie records transfers to your accounts at banks it doesn&apos;t track here. Connect that bank and they&apos;ll be paired
                automatically.
            </Trans>
        </Text>
    </View>
);
