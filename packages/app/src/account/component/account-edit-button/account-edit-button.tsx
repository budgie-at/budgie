import { AccountEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';

interface Props extends Pick<AccountEntityInterface, 'id'> {
    readonly className?: string;
}

export const AccountEditButton = ({ id, className }: Props) => {
    const { t } = useLingui();

    const navigateToEditAccount = () => void router.push({ pathname: '/account/[id]/update', params: { id: String(id) } });

    return (
        <HapticPressable
            className={cn('rounded-full active:bg-secondary-background', className)}
            onPress={navigateToEditAccount}
            accessibilityRole="button"
            accessibilityLabel={t`Edit account`}
        >
            <Icon className="text-primary" icon={UserIconNameEnum.EllipsisVertical} size={14} />
        </HapticPressable>
    );
};
