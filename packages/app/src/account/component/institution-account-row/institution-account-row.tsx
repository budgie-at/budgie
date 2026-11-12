import { AccountTypeEnum, ExternalSourceEnum, InstrumentTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { BankLogo } from '../../../@generic/component/bank-logo/bank-logo';
import { CurrencySelectorInstrumentIcon } from '../../../@generic/component/currency-selector-instrument-icon/currency-selector-instrument-icon';
import { isListedSecurityType } from '../../../instrument/utils/is-listed-security-type.util';
import { TransactionRowSurface } from '../../../transaction/components/transaction-row-surface/transaction-row-surface';
import { AccountRowLeadingContext } from '../../context/account-row-leading.context';
import { getInstitutionAccountTitle } from '../../utils/get-institution-account-title.util';
import { AccountListItem } from '../account-list-item/account-list-item';

import type { TransactionListRowPositionEnum } from '../../../transaction/enum/transaction-list-row-position.enum';
import type { HomeAccountBalanceInterface } from '../../interface/home-account-balance.interface';
import type { AccountWithSyncEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: AccountWithSyncEntityInterface;
    readonly provider: ExternalSourceEnum;
    readonly bankName: string | null;
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
    readonly position: TransactionListRowPositionEnum;
}

export const InstitutionAccountRow = ({ account, provider, bankName, balancesByAccountId, position }: Props) => {
    const { t } = useLingui();
    const isBrokerageCash = provider === ExternalSourceEnum.MANUAL && account.instrument.type === InstrumentTypeEnum.FIAT;
    const displayAccount = { ...account, title: isBrokerageCash ? t`Cash` : getInstitutionAccountTitle(account.title, provider) };
    const logoBankName = bankName ?? account.title;
    const leading =
        account.type === AccountTypeEnum.CRYPTO_SYNC || isListedSecurityType(account.instrument.type) ? (
            <CurrencySelectorInstrumentIcon
                code={account.instrument.code}
                symbol={account.instrument.symbol}
                type={account.instrument.type}
                size={44}
            />
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
