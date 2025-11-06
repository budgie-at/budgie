import { AccountEntityInterface, AccountTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { ICONS, IconName } from '../../../@generic/constant/icons.constant';
import { useVibration } from '../../../@generic/hooks/use-vibration.hook';
import { AccountCard } from '../account-card/account-card';





interface Props {
    readonly accounts: AccountEntityInterface[];
    readonly type: AccountTypeEnum;
}

const DEFAULT_ICON: IconName = 'Home';

export const AccountList = ({ accounts, type }: Props) => {
    const [, hapticImpact] = useVibration();
    const { t } = useLingui();

    const accountTypes = {
        [AccountTypeEnum.BANK]: t`Bank`,
        [AccountTypeEnum.CASH]: t`Cash`,
        [AccountTypeEnum.CRYPTO]: t`Crypto`,
        [AccountTypeEnum.STOCKS]: t`Stocks`
    };

    const handleAddAccount = () => {
        void router.push(`/create-account/${type}`);
        hapticImpact(ImpactFeedbackStyle.Light);
    };

    return (
        <View className={'gap-y-[12px]'}>
            <View className={'flex-row justify-between items-center'}>
                <Text className={'text-[12px] uppercase text-secondary-foreground'}>{accountTypes[type]}</Text>

                <Pressable onPress={handleAddAccount}>
                    <CircleIcon border={false} icon={ICONS.Plus} variant={'ghost'} size={'lg'} />
                </Pressable>
            </View>

            <View className="flex-row flex-wrap -mx-1.5 gap-y-3 pb-[30px]">
                {accounts.map(({ id, balance, currency, title }) => (
                    <View className="w-1/2 px-1.5" key={id}>
                        <AccountCard id={id} balance={balance} currency={currency} icon={DEFAULT_ICON} title={title} />
                    </View>
                ))}
            </View>
        </View>
    );
};
