import { AccountTypeEnum } from '@budgie/contracts';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { CryptoCurrencyIcon } from '../../../@generic/component/crypto-currency-icon/crypto-currency-icon';
import { TransactionRowSurface } from '../../../transaction/components/transaction-row-surface/transaction-row-surface';
import { stripTransactionAccountTitlePrefix } from '../../../transaction/utils/strip-transaction-account-title-prefix.util';
import { AccountRowLeadingContext } from '../../context/account-row-leading.context';
import { AccountListItem } from '../account-list-item/account-list-item';

import type { TransactionListRowPositionEnum } from '../../../transaction/enum/transaction-list-row-position.enum';
import type { HomeAccountBalanceInterface } from '../../interface/home-account-balance.interface';
import type { AccountWithSyncEntityInterface, ExternalSourceEnum } from '@budgie/contracts';

interface Props {
    readonly account: AccountWithSyncEntityInterface;
    readonly provider: ExternalSourceEnum;
    readonly bankName: string | null;
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
    readonly position: TransactionListRowPositionEnum;
}

export const InstitutionAccountRow = ({ account, provider, bankName, balancesByAccountId, position }: Props) => {
    const displayAccount = {
        ...account,
        title: stripTransactionAccountTitlePrefix(account.title, provider) ?? account.title
    };
    const leading =
        account.type === AccountTypeEnum.CRYPTO_SYNC ? (
            <CryptoCurrencyIcon code={account.instrument.code} size={44} className="bg-surface-disc" />
        ) : (
            <BankLogo bankProvider={provider} bankName={bankName ?? account.title} size={44} />
        );

    return (
        <TransactionRowSurface position={position}>
            <AccountRowLeadingContext value={leading}>
                <AccountListItem account={displayAccount} balancesByAccountId={balancesByAccountId} />
            </AccountRowLeadingContext>
        </TransactionRowSurface>
    );
};
