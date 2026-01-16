import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
import { Icon } from '../../../@generic/component/icon/icon';

export const AccountsEmptyState = () => {
    const router = useRouter();

    const handleAddAccount = () => void router.push('/create-account');

    return (
        <View className="flex-1 items-center justify-center pb-20">
            <View className="items-center max-w-62.5">
                <View className="rounded-full bg-secondary-background border border-secondary-corner p-7xl mb-3xl">
                    <Icon className="text-secondary-foreground" icon={UserIconNameEnum.Wallet} size={48} />
                </View>

                <Text className="text-primary text-md mb-lg">
                    <Trans>No accounts yet</Trans>
                </Text>
                <Text className="text-secondary-foreground text-sm text-center mb-5xl">
                    <Trans>Add your first account to start tracking your finances</Trans>
                </Text>

                <Button
                    // eslint-disable-next-line lingui/no-unlocalized-strings
                    testID="Home.AddAccountButton"
                    variant="primary"
                    size="md"
                    leftIcon={UserIconNameEnum.Plus}
                    onPress={handleAddAccount}
                    content={<Trans>Add Account</Trans>}
                />
            </View>
        </View>
    );
};
