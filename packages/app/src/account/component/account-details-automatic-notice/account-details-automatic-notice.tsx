import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { AccountAutomaticPill } from '../account-automatic-pill/account-automatic-pill';

export const AccountDetailsAutomaticNotice = () => (
    <View className="items-center gap-y-md px-xl">
        <AccountAutomaticPill />
        <Text className="text-sm text-secondary-foreground text-center">
            <Trans>
                Transfers to your accounts at banks Budgie doesn&apos;t track wait here until they&apos;re matched, and aren&apos;t counted
                in net worth. Connect the bank or import its statement and Budgie will match them automatically.
            </Trans>
        </Text>
    </View>
);
