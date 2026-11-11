import { AccountTypeEnum } from '@budgie/contracts';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { CryptoCurrencyIcon } from '../../../@generic/component/crypto-currency-icon/crypto-currency-icon';
import { TransactionRowSurface } from '../../../transaction/components/transaction-row-surface/transaction-row-surface';
import { AccountRowLeadingContext } from '../../context/account-row-leading.context';
import { getInstitutionAccountTitle } from '../../utils/get-institution-account-title.util';
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
    const displayAccount = { ...account, title: getInstitutionAccountTitle(account.title, provider) };
    const logoBankName = bankName ?? account.title;
    const leading =
        account.type === AccountTypeEnum.CRYPTO_SYNC ? (
            <CryptoCurrencyIcon code={account.instrument.code} size={44} className="bg-surface-disc" />
        ) : (
            <BankLogo bankProvider={provider} bankName={logoBankName} size={44} />
        );

    return (
        <TransactionRowSurface separatorInset={64} position={position}>
            <AccountRowLeadingContext value={leading}>
                <AccountListItem account={displayAccount} balancesByAccountId={balancesByAccountId} />
            </AccountRowLeadingContext>
        </TransactionRowSurface>
    );
};
