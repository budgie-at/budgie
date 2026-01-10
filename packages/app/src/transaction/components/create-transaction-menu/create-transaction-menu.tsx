import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { AnimatedActionItem } from '../../../@generic/component/animated-action-menu/animated-action-item';
import { AnimatedActionMenu } from '../../../@generic/component/animated-action-menu/animated-action-menu';

const TOTAL_ITEMS = 4;

const handleCreateExpense = () => void router.push('/create-transaction/expense');
const handleCreateIncome = () => void router.push('/create-transaction/income');
const handleCreateTransfer = () => void router.push('/create-transaction/transfer');
const handleCreateAccount = () => void router.push('/(main)/create-account');

export const CreateTransactionMenu = () => {
    const { t } = useLingui();

    return (
        <AnimatedActionMenu>
            <AnimatedActionItem
                icon={UserIconNameEnum.TrendingDown}
                label={t`Expense`}
                variant="destructive"
                index={0}
                totalItems={TOTAL_ITEMS}
                onPress={handleCreateExpense}
            />
            <AnimatedActionItem
                icon={UserIconNameEnum.TrendingUp}
                label={t`Income`}
                variant="positive"
                index={1}
                totalItems={TOTAL_ITEMS}
                onPress={handleCreateIncome}
            />
            <AnimatedActionItem
                icon={UserIconNameEnum.ArrowLeftRight}
                label={t`Transfer`}
                variant="warning"
                index={2}
                totalItems={TOTAL_ITEMS}
                onPress={handleCreateTransfer}
            />
            <AnimatedActionItem
                icon={UserIconNameEnum.Wallet}
                label={t`Account`}
                variant="secondary"
                index={3}
                totalItems={TOTAL_ITEMS}
                onPress={handleCreateAccount}
            />
        </AnimatedActionMenu>
    );
};
