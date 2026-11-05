import { ExternalSourceEnum } from '@budgie/contracts';

import { getInzhurShortTitle } from '../../../inzhur/utils/get-inzhur-short-title.util';
import { stripTransactionAccountTitlePrefix } from '../../../transaction/utils/strip-transaction-account-title-prefix.util';
import { AccountRowDisclosureContext } from '../../context/account-row-disclosure.context';
import { AccountRowLeadingContext } from '../../context/account-row-leading.context';
import { AccountListItem } from '../account-list-item/account-list-item';
import { InstitutionAccountLeading } from '../institution-account-leading/institution-account-leading';

import type { HomeAccountBalanceInterface } from '../../interface/home-account-balance.interface';
import type { AccountWithSyncEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: AccountWithSyncEntityInterface;
    readonly provider: ExternalSourceEnum;
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
}

export const InstitutionAccountRow = ({ account, provider, balancesByAccountId }: Props) => {
    const title =
        provider === ExternalSourceEnum.INZHUR
            ? getInzhurShortTitle(account.title)
            : (stripTransactionAccountTitlePrefix(account.title, provider) ?? account.title);
    const displayAccount = { ...account, title };

    return (
        <AccountRowDisclosureContext value>
            <AccountRowLeadingContext value={<InstitutionAccountLeading account={account} provider={provider} />}>
                <AccountListItem account={displayAccount} balancesByAccountId={balancesByAccountId} />
            </AccountRowLeadingContext>
        </AccountRowDisclosureContext>
    );
};
