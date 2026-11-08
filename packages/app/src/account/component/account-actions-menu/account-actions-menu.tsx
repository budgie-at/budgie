import { AccountDebtTypeEnum, AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { ActionsMenuItem } from '../../../@generic/component/actions-menu-item/actions-menu-item';
import { ActionsMenu } from '../../../@generic/component/actions-menu/actions-menu';
import { Icon } from '../../../@generic/component/icon/icon';
import { dismissAllOrReplace } from '../../../@generic/utils/dismiss-all-or-replace.util';
import { AccountDetailsSelector } from '../../../app/(main)/account/[id]/account-details.selector';
import { useRevertInstallmentPlan } from '../../../installment-plan/hook/use-revert-installment-plan.hook';
import { useArchiveAccount } from '../../hooks/use-archive-account.hook';

import { useDepositCloseAction } from './use-deposit-close-action.hook';

import type { AccountEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: Pick<AccountEntityInterface, 'id' | 'type' | 'debtType'>;
    readonly balance: number;
    readonly instrumentSymbol: string;
}

export const AccountActionsMenu = ({ account, balance, instrumentSymbol }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const closeAction = useDepositCloseAction(account.id, balance, instrumentSymbol);
    const archiveAction = useArchiveAccount(account.id, () => void dismissAllOrReplace('/'));
    const revertAction = useRevertInstallmentPlan();

    const handleEdit = () => void router.navigate({ pathname: '/account/[id]/update', params: { id: String(account.id) } });
    const handleRevert = () => void revertAction.revert(account.id, () => void dismissAllOrReplace('/'));

    const isBusy = closeAction.isLoading || archiveAction.isLoading || revertAction.isLoading;
    const isInstallmentPlan = account.type === AccountTypeEnum.DEBT && account.debtType === AccountDebtTypeEnum.INSTALLMENT;

    const typeSpecificItem =
        account.type === AccountTypeEnum.DEPOSIT ? (
            <ActionsMenuItem
                icon={UserIconNameEnum.LogOut}
                label={t`Close Deposit`}
                onPress={closeAction.handleCloseDeposit}
                variant="destructive"
                testID={AccountDetailsSelector.CloseDepositButton}
            />
        ) : (
            <ActionsMenuItem
                icon={UserIconNameEnum.Archive}
                label={t`Archive`}
                onPress={archiveAction.handleArchive}
                testID={AccountDetailsSelector.ArchiveMenuButton}
            />
        );

    return (
        <ActionsMenu
            trigger={<Icon icon={UserIconNameEnum.EllipsisVertical} className="text-primary" size={24} />}
            accessibilityLabel={t`Account actions`}
            isDisabled={isBusy}
            triggerClassName="ml-auto size-[44px] items-center justify-center"
            triggerTestID={AccountDetailsSelector.ActionsButton}
        >
            <ActionsMenuItem
                icon={UserIconNameEnum.Pencil}
                label={t`Edit account`}
                onPress={handleEdit}
                testID={AccountDetailsSelector.EditButton}
            />
            {isInstallmentPlan ? (
                <ActionsMenuItem
                    icon={UserIconNameEnum.Undo2}
                    label={t`Undo pay in parts`}
                    onPress={handleRevert}
                    variant="destructive"
                    testID={AccountDetailsSelector.RevertInstallmentPlanButton}
                />
            ) : null}
            {archiveAction.isArchivable ? typeSpecificItem : null}
        </ActionsMenu>
    );
};
