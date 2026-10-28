import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';

import { ActionsMenuItem } from '../../../@generic/component/actions-menu-item/actions-menu-item';
import { ActionsMenu } from '../../../@generic/component/actions-menu/actions-menu';
import { Icon } from '../../../@generic/component/icon/icon';
import { dismissAllOrReplace } from '../../../@generic/utils/dismiss-all-or-replace.util';
import { AccountDetailsSelector } from '../../../app/(main)/account/[id]/account-details.selector';
import { useArchiveAccount } from '../../hooks/use-archive-account.hook';

import { useDepositCloseAction } from './use-deposit-close-action.hook';

interface Props {
    readonly accountId: number;
    readonly accountType: AccountTypeEnum;
    readonly balance: number;
    readonly instrumentSymbol: string;
}

export const AccountActionsMenu = ({ accountId, accountType, balance, instrumentSymbol }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const closeAction = useDepositCloseAction(accountId, balance, instrumentSymbol);
    const archiveAction = useArchiveAccount(accountId, () => void dismissAllOrReplace('/'));

    const handleEdit = () => void router.navigate({ pathname: '/account/[id]/update', params: { id: String(accountId) } });
    const handleArchive = () => void archiveAction.handleArchive();

    const isBusy = closeAction.isLoading || archiveAction.isLoading;

    const typeSpecificItem =
        accountType === AccountTypeEnum.DEPOSIT ? (
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
                onPress={handleArchive}
                testID={AccountDetailsSelector.ArchiveMenuButton}
            />
        );

    return (
        <ActionsMenu
            trigger={<Icon icon={UserIconNameEnum.EllipsisVertical} className="text-primary" size={24} />}
            accessibilityLabel={t`Account actions`}
            isDisabled={isBusy}
            triggerClassName="ml-auto h-10 w-10 items-center justify-center"
            triggerTestID={AccountDetailsSelector.ActionsButton}
        >
            <ActionsMenuItem
                icon={UserIconNameEnum.Pencil}
                label={t`Edit account`}
                onPress={handleEdit}
                testID={AccountDetailsSelector.EditButton}
            />
            {typeSpecificItem}
        </ActionsMenu>
    );
};
