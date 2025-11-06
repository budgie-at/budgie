import { AccountTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS, IconName } from '../../../@generic/constant/icons.constant';
import { useVibration } from '../../../@generic/hooks/use-vibration.hook';
import { cn } from '../../../@generic/utils/cn.util';


interface Props {
    title: string;
    icon: IconName;
    className?: string;
    type: AccountTypeEnum;
    showBackBtn?: boolean;
}

export const AccountHeader = ({ title, icon, type, className, showBackBtn }: Props) => {
    const [, hapticImpact] = useVibration();
    const { t } = useLingui();

    const accountTypes = {
        [AccountTypeEnum.BANK]: t`Bank`,
        [AccountTypeEnum.CASH]: t`Cash`,
        [AccountTypeEnum.CRYPTO]: t`Crypto`,
        [AccountTypeEnum.STOCKS]: t`Stocks`
    };

    const goBack = () => {
        void router.back();
        hapticImpact(ImpactFeedbackStyle.Light);
    };

    return (
        <View className={cn('flex-row items-center gap-x-[12px] px-5xl', className)}>
            {showBackBtn ? (
                <Pressable onPress={goBack}>
                    <Icon className={'text-primary'} icon={ICONS.ChevronLeft} size={24} />
                </Pressable>
            ) : null}

            <CircleIcon icon={ICONS[icon]} variant={'default'} size={'2xl'} className={'rounded-[16px]'} />

            <View className={'gap-y-[3px]'}>
                <Text className={'text-primary font-medium text-[24px]'}>{title}</Text>
                <Text className={'uppercase text-default-foreground font-medium text-[12px]'}>{accountTypes[type]}</Text>
            </View>
        </View>
    );
};
