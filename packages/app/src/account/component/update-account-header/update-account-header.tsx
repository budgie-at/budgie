import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/components/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';

interface Props {
    readonly onGoBack: EmptyFn;
    readonly className?: string;
    readonly icon: UserIconNameEnum;
    readonly accountType: AccountTypeEnum;
}

const accountTypeVariants = cva('text-sm uppercase font-medium', {
    variants: {
        accountType: ACCOUNT_COLOR
    }
});

export const UpdateAccountHeader = ({ className, accountType, icon, onGoBack }: Props) => {
    const { i18n } = useLingui();

    return (
        <View className={cn('px-5xl flex-row items-center gap-x-xl pb-7xl border-b border-b-secondary-corner', className)}>
            <HapticPressable onPress={onGoBack} className="p-md">
                <Icon className="text-primary" size={24} icon={ICONS.ChevronLeft} />
            </HapticPressable>

            <CircleIcon icon={ICONS[icon]} variant="default" size="2xl" className="rounded-3xl" />

            <View className="gap-y-xs">
                <Text className="text-primary font-semibold text-3xl">
                    <Trans>Account Settings</Trans>
                </Text>

                <Text className={accountTypeVariants({ accountType })}>{i18n.t(ACCOUNT_TYPE[accountType])}</Text>
            </View>
        </View>
    );
};
