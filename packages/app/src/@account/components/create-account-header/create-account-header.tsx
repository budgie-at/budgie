import { Trans } from '@lingui/react/macro';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { useVibration } from '../../../@generic/hooks/use-vibration.hook';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    className?: string;
}

export const CreateAccountHeader = ({className}: Props) => {
    const [, hapticImpact] = useVibration();

    const goBack = () => {
        void router.back();
        hapticImpact(ImpactFeedbackStyle.Light);
    };

    return (
        <View className={cn('px-[20px] flex-row items-center gap-x-[12px]', className)}>
            <Pressable onPress={goBack} className={'p-[8px]'}>
                <Icon className={'text-secondary-foreground'} size={24} icon={ICONS.ChevronLeft} />
            </Pressable>

            <View className={'bap-y-[3px]'}>
                <Text className={'text-primary font-semibold text-[24px]'}>
                    <Trans>Checking Account</Trans>
                </Text>
                <Text className={'text-secondary-foreground text-[12px]'}>
                    <Trans>Checking Account</Trans>
                </Text>
            </View>
        </View>
    );
};
