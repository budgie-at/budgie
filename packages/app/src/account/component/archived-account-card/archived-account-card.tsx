import { AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { DeletableRow } from '../../../@generic/component/deletable-row/deletable-row';
import { GroupedListItem } from '../../../@generic/component/grouped-list-item/grouped-list-item';
import { useFormatInstrumentAmount } from '../../../i18n/hook/use-format-instrument-amount.hook';
import { ACCOUNT_TYPE } from '../../constant/account-type.constant';
import { ArchivedAccountActionsContext } from '../../context/archived-account-actions.context';
import { useDeleteArchivedAccount } from '../../hooks/use-delete-archived-account.hook';
import { useFormatArchivedDate } from '../../hooks/use-format-archived-date.hook';
import { useRestoreArchivedAccount } from '../../hooks/use-restore-archived-account.hook';
import { useArchivedAccountBalanceQuery } from '../../query/use-archived-account-balance.query';
import { ArchivedAccountClosedMenuNote } from '../archived-account-closed-menu-note/archived-account-closed-menu-note';
import { ArchivedAccountDeleteMenuItem } from '../archived-account-delete-menu-item/archived-account-delete-menu-item';
import { ArchivedAccountRestoreMenuItem } from '../archived-account-restore-menu-item/archived-account-restore-menu-item';
import { ArchivedAccountTrailing } from '../archived-account-trailing/archived-account-trailing';
import { ShelvedAccountRow } from '../shelved-account-row/shelved-account-row';
import { ShelvedAccountSubtitle } from '../shelved-account-subtitle/shelved-account-subtitle';

import { ArchivedAccountCardSelector } from './archived-account-card.selector';

interface Props {
    readonly account: AccountWithInstrumentEntityInterface;
    readonly isFirst: boolean;
    readonly isLast: boolean;
}

export const ArchivedAccountCard = ({ account, isFirst, isLast }: Props) => {
    const { t } = useLingui();
    const formatInstrumentAmount = useFormatInstrumentAmount();
    const { balance } = useArchivedAccountBalanceQuery(account.id);
    const { isLoading, restore } = useRestoreArchivedAccount(account);
    const { deleteAccount } = useDeleteArchivedAccount(account);
    const archivedDate = useFormatArchivedDate(account.deletedAt);

    const formattedBalance = formatInstrumentAmount(balance, account.instrument.symbol, account.instrument.type);
    const accountType = t(ACCOUNT_TYPE[account.type]);
    const notice = isDefined(archivedDate) ? t`Archived ${archivedDate}` : t`Archived`;
    const closedLabel = account.isExternal ? t`, closed at the provider` : '';
    const actions = { isLoading, restore, deleteAccount };
    const accessibilityActions = [
        ...(account.isExternal ? [] : [{ name: 'restore', label: t`Restore`, onPress: restore }]),
        { name: 'delete', label: t`Delete permanently`, onPress: deleteAccount }
    ];

    return (
        <GroupedListItem isFirst={isFirst} isLast={isLast}>
            <ArchivedAccountActionsContext value={actions}>
                <DeletableRow id={account.id} onDelete={deleteAccount} label={t`Delete permanently`} variant="fill">
                    <ShelvedAccountRow
                        account={account}
                        subtitle={<ShelvedAccountSubtitle formattedBalance={formattedBalance} metadata={accountType} notice={notice} />}
                        trailing={<ArchivedAccountTrailing account={account} />}
                        accessibilityLabel={`${account.title}, ${formattedBalance}, ${accountType}, ${notice}${closedLabel}`}
                        accessibilityActions={accessibilityActions}
                        testID={ArchivedAccountCardSelector.Card(account.title)}
                    >
                        <ArchivedAccountClosedMenuNote account={account} />
                        <ArchivedAccountRestoreMenuItem account={account} />
                        <ArchivedAccountDeleteMenuItem account={account} />
                    </ShelvedAccountRow>
                </DeletableRow>
            </ArchivedAccountActionsContext>
        </GroupedListItem>
    );
};
