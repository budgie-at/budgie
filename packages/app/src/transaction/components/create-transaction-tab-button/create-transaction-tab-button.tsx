import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useRadialActionMenu } from '../../../@generic/component/radial-action-menu/radial-action-menu.context';
import { TRANSACTION_COLOR } from '../../constant/transaction-color.constant';
import { TRANSACTION_ICON } from '../../constant/transaction-icon.constant';
import { TRANSACTION_TYPE } from '../../constant/transaction-type.constant';

import type { RadialActionItemInterface } from '../../../@generic/component/radial-action-menu/radial-action-item.interface';

const BUTTON_SIZE = 56;

export const CreateTransactionTabButton = () => {
    const { t } = useLingui();
    const { open } = useRadialActionMenu();

    const handleOpen = () => {
        const items: RadialActionItemInterface[] = [
            {
                icon: TRANSACTION_ICON.EXPENSE,
                label: t(TRANSACTION_TYPE.EXPENSE),
                variant: TRANSACTION_COLOR.EXPENSE,
                onPress: () => void router.push('/create-transaction/expense')
            },
            {
                icon: TRANSACTION_ICON.INCOME,
                label: t(TRANSACTION_TYPE.INCOME),
                variant: TRANSACTION_COLOR.INCOME,
                onPress: () => void router.push('/create-transaction/income')
            },
            {
                icon: TRANSACTION_ICON.TRANSFER,
                label: t(TRANSACTION_TYPE.TRANSFER),
                variant: TRANSACTION_COLOR.TRANSFER,
                onPress: () => void router.push('/create-transaction/transfer')
            },
            {
                icon: UserIconNameEnum.Wallet,
                label: t`Account`,
                variant: 'secondary',
                onPress: () => void router.push('/(main)/create-account')
            }
        ];

        open(items);
    };

    const buttonStyle = { width: BUTTON_SIZE, height: BUTTON_SIZE };

    return (
        <HapticPressable className="bg-primary rounded-full items-center justify-center" style={buttonStyle} onPress={handleOpen}>
            <Icon className="text-primary-reverse" icon={UserIconNameEnum.Plus} size={24} />
        </HapticPressable>
    );
};
