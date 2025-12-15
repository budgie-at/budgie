import { AccountTypeEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/components/icon/icon';
import { Page } from '../../../@generic/components/page/page';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { CreateAccountCard } from '../../../account/component/create-account-card/create-account-card';
import { ACCOUNT_ICON } from '../../../account/constant/account-icon.constant';

export default function Index() {
    const { t } = useLingui();

    const handleClose = () => void router.back();

    return (
        <Page>
            <View className="gap-y-3xl mb-[30px]">
                <View className="flex-row items-center justify-between">
                    <Text className="text-primary text-4.5xl font-semibold">
                        <Trans>New Account</Trans>
                    </Text>

                    <HapticPressable onPress={handleClose} className="p-xs">
                        <Icon className="text-primary" icon={ICONS.X} size={16} />
                    </HapticPressable>
                </View>

                <Text className="text-secondary-foreground text-sm">
                    <Trans>Choose the type of account you want to add</Trans>
                </Text>
            </View>

            <ScrollView contentContainerClassName="gap-y-xl">
                <CreateAccountCard
                    description={t`Everyday transactions and spending`}
                    icon={ACCOUNT_ICON.BANK}
                    title={t`Checking Account`}
                    type={AccountTypeEnum.BANK}
                />
                <CreateAccountCard
                    description={t`Emergency fund and savings goals`}
                    icon={ACCOUNT_ICON.CASH}
                    title={t`Savings Account`}
                    type={AccountTypeEnum.CASH}
                />
            </ScrollView>
        </Page>
    );
}
