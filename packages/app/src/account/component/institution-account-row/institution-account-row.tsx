import { ExternalSourceEnum } from '@budgie/contracts';

import { TransactionRowSurface } from '../../../transaction/components/transaction-row-surface/transaction-row-surface';
import { stripTransactionAccountTitlePrefix } from '../../../transaction/utils/strip-transaction-account-title-prefix.util';
import { AccountRowLeadingContext } from '../../context/account-row-leading.context';
import { AccountListItem } from '../account-list-item/account-list-item';
import { InstitutionAccountLeading } from '../institution-account-leading/institution-account-leading';

import type { TransactionListRowPositionEnum } from '../../../transaction/enum/transaction-list-row-position.enum';
import type { HomeAccountBalanceInterface } from '../../interface/home-account-balance.interface';
import type { AccountWithSyncEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: AccountWithSyncEntityInterface;
    readonly provider: ExternalSourceEnum;
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
    readonly position: TransactionListRowPositionEnum;
}

export const InstitutionAccountRow = ({ account, provider, balancesByAccountId, position }: Props) => {
    const titlePrefix = provider === ExternalSourceEnum.INZHUR ? null : provider;
    const displayAccount = { ...account, title: stripTransactionAccountTitlePrefix(account.title, titlePrefix) ?? account.title };

    return (
        <TransactionRowSurface position={position}>
            <AccountRowLeadingContext value={<InstitutionAccountLeading account={account} provider={provider} />}>
                <AccountListItem account={displayAccount} balancesByAccountId={balancesByAccountId} />
            </AccountRowLeadingContext>
        </TransactionRowSurface>
    );
};
