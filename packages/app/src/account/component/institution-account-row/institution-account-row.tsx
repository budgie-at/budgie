import { TransactionRowSurface } from '../../../transaction/components/transaction-row-surface/transaction-row-surface';
import { AccountRowLeadingContext } from '../../context/account-row-leading.context';
import { AccountListItem } from '../account-list-item/account-list-item';
import { InstitutionMark } from '../institution-mark/institution-mark';

import type { TransactionListRowPositionEnum } from '../../../transaction/enum/transaction-list-row-position.enum';
import type { HomeAccountBalanceInterface } from '../../interface/home-account-balance.interface';
import type { AccountWithSyncEntityInterface, ExternalSourceEnum } from '@budgie/contracts';

interface Props {
    readonly account: AccountWithSyncEntityInterface;
    readonly provider: ExternalSourceEnum;
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
    readonly position: TransactionListRowPositionEnum;
}

export const InstitutionAccountRow = ({ account, provider, balancesByAccountId, position }: Props) => (
    <TransactionRowSurface position={position}>
        <AccountRowLeadingContext value={<InstitutionMark provider={provider} title={account.title} />}>
            <AccountListItem account={account} type={account.type} balancesByAccountId={balancesByAccountId} />
        </AccountRowLeadingContext>
    </TransactionRowSurface>
);
