import { AccountEntityInterface, AccountTypeEnum } from '@budgie/contracts';
import { useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { AccountBankSyncCard } from '../../../sync/component/account-bank-sync-card/account-bank-sync-card';
import { useAccountForm } from '../../hooks/use-account-form.hook';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';
import { accountService } from '../../service/account.service';
import { AccountTypeSelectorField } from '../account-type-selector-field/account-type-selector-field';
import { UpdateAccountScreen } from '../create-account-screen/update-account-screen';
import { IncludeInNetWorthField } from '../include-in-net-worth-field/include-in-net-worth-field';

interface Props {
    readonly account: AccountEntityInterface;
}

const CHANGEABLE_ACCOUNT_TYPES: AccountTypeEnum[] = [
    AccountTypeEnum.BANK,
    AccountTypeEnum.CASH,
    AccountTypeEnum.SAVINGS,
    AccountTypeEnum.CRYPTO,
    AccountTypeEnum.STOCKS
];

export const UpdateLiabilityAccount = ({ account }: Props) => {
    const { balance } = useAccountBalanceQuery(account.id);

    const { control, handleSubmit, instrument } = useAccountForm(
        {
            externalId: account.externalId,
            iban: account.iban,
            type: account.type,
            icon: account.icon,
            title: account.title,
            currentBalance: balance,
            instrumentId: account.instrumentId,
            includeInNetWorth: account.includeInNetWorth,
            isActive: account.isActive
        },
        async values => await accountService.updateById(account.id, values)
    );

    const currentType = useWatch({ control, name: 'type' });
    const canChangeType = CHANGEABLE_ACCOUNT_TYPES.includes(account.type);
    const isBankSyncAccount = account.type === AccountTypeEnum.BANK_SYNC;

    const updatedAccount = { ...account, type: currentType };

    if (!isDefined(instrument)) {
        return <EmptyScreen />;
    }

    return (
        <UpdateAccountScreen
            instrumentSymbol={instrument.symbol}
            onSubmit={handleSubmit}
            account={updatedAccount}
            control={control}
            allowNegativeBalance
        >
            {canChangeType ? <AccountTypeSelectorField control={control} /> : null}
            {isBankSyncAccount ? <AccountBankSyncCard accountId={account.id} /> : null}
            <IncludeInNetWorthField control={control} />
        </UpdateAccountScreen>
    );
};
