import { AccountEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

export const AccountEditButton = ({ id }: Pick<AccountEntityInterface, 'id'>) => {
    const { t } = useLingui();

    const navigateToEditAccount = () => void router.push({ pathname: '/account/[id]/update', params: { id: String(id) } });

    return (
        <HapticPressable
            className="-mr-xs size-[28px] items-center justify-center rounded-full bg-secondary-background active:scale-s active:opacity-70"
            onPress={navigateToEditAccount}
            accessibilityRole="button"
            accessibilityLabel={t`Edit account`}
        >
            <Icon className="text-secondary-foreground" icon={UserIconNameEnum.Ellipsis} size={16} weight="Filled" />
        </HapticPressable>
    );
};
