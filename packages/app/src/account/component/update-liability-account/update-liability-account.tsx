import { AccountTypeEnum, AccountWithInstrumentEntityInterface, ExternalSourceEnum, InstrumentTypeEnum } from '@budgie/contracts';
import { AccountService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Struct from 'effect/Struct';
import { useController } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { CreateAccountCurrencyField } from '../../../@generic/component/create-account-currency-field/create-account-currency-field';
import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useStickyDefinedValue } from '../../../@generic/hook/use-sticky-defined-value.hook';
import { UpdateInzhurAccountPage } from '../../../inzhur/component/update-inzhur-account-page/update-inzhur-account-page';
import { isInzhurFundAccount } from '../../../inzhur/utils/is-inzhur-fund-account.util';
import { AccountConnectBankRow } from '../../../sync/component/account-connect-bank-row/account-connect-bank-row';
import { AccountSyncCard } from '../../../sync/component/account-sync-card/account-sync-card';
import { useAccountUpdateBindings } from '../../hooks/use-account-update-bindings.hook';
import { useLiabilityAccountForm } from '../../hooks/use-liability-account-form.hook';
import { useAccountBalanceQuery } from '../../query/use-account-balance.query';
import { UpdateAccountScreen } from '../create-account-screen/update-account-screen';

interface Props {
    readonly account: AccountWithInstrumentEntityInterface;
}

export const UpdateLiabilityAccount = ({ account }: Props) => {
    const { t } = useLingui();
    const { balance } = useAccountBalanceQuery(account.id);

    const formValues = {
        ...Struct.pick(account, ['externalId', 'iban', 'type', 'icon', 'title', 'instrumentId', 'includeInNetWorth', 'isActive']),
        currentBalance: balance
    };

    const { control, handleSubmit, instrument, isSubmitting } = useLiabilityAccountForm(formValues, values =>
        Effect.gen(function* () {
            return yield* Effect.flatMap(AccountService, accountService =>
                accountService.updateById(account.id, Struct.omit(values, ['type']))
            );
        })
    );

    const fields = {
        ...useAccountUpdateBindings(control, {
            title: 'title',
            icon: 'icon',
            currentBalance: 'currentBalance',
            isActive: 'isActive',
            includeInNetWorth: 'includeInNetWorth'
        }),
        instrumentId: useController({ control, name: 'instrumentId' })
    };
    const stickyInstrument = useStickyDefinedValue(instrument);
    const isBankManaged = account.externalSource !== ExternalSourceEnum.INZHUR;
    const isSyncedAccount = account.type === AccountTypeEnum.BANK_SYNC || account.type === AccountTypeEnum.CRYPTO_SYNC;
    const currencyField =
        account.type === AccountTypeEnum.CRYPTO ? (
            <GroupedListSection title={t`Currency`}>
                <CreateAccountCurrencyField
                    value={fields.instrumentId.field.value}
                    onChange={fields.instrumentId.field.onChange}
                    instrumentType={InstrumentTypeEnum.CRYPTO}
                />
            </GroupedListSection>
        ) : null;

    if (!isDefined(stickyInstrument)) {
        return <EmptyScreen />;
    }

    if (isInzhurFundAccount(account)) {
        return (
            <UpdateInzhurAccountPage
                account={account}
                balance={balance}
                fields={fields}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
            />
        );
    }

    return (
        <UpdateAccountScreen
            account={account}
            allowNegativeBalance
            fields={fields}
            instrumentSymbol={stickyInstrument.symbol}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
        >
            {currencyField}
            {isBankManaged && isSyncedAccount ? <AccountSyncCard accountId={account.id} /> : null}
            {isBankManaged && (account.type === AccountTypeEnum.BANK || account.type === AccountTypeEnum.BANK_SYNC) ? (
                <AccountConnectBankRow accountId={account.id} />
            ) : null}
        </UpdateAccountScreen>
    );
};
