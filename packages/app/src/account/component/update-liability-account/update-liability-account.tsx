import { AccountTypeEnum, AccountWithInstrumentEntityInterface, InstrumentTypeEnum } from '@budgie/contracts';
import { AccountService } from '@budgie/ledger';
import { InzhurSetupService } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as Struct from 'effect/Struct';
import { useController } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { CreateAccountCurrencyField } from '../../../@generic/component/create-account-currency-field/create-account-currency-field';
import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useStickyDefinedValue } from '../../../@generic/hook/use-sticky-defined-value.hook';
import { InzhurActualBalanceNote } from '../../../inzhur/component/inzhur-actual-balance-note/inzhur-actual-balance-note';
import { InzhurDividendPayoutField } from '../../../inzhur/component/inzhur-dividend-payout-field/inzhur-dividend-payout-field';
import { isInzhurCashAccount } from '../../../inzhur/utils/is-inzhur-cash-account.util';
import { isInzhurFundAccount } from '../../../inzhur/utils/is-inzhur-fund-account.util';
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
        ...Struct.pick(account, [
            'externalId',
            'iban',
            'type',
            'icon',
            'title',
            'instrumentId',
            'includeInNetWorth',
            'isActive',
            'dividendPayout'
        ]),
        currentBalance: balance
    };

    const isInzhurCash = isInzhurCashAccount(account);
    const isInzhurFund = isInzhurFundAccount(account);

    const { control, handleSubmit, instrument, isSubmitting } = useLiabilityAccountForm(formValues, values =>
        Effect.gen(function* () {
            if (isInzhurCash) {
                return yield* Effect.flatMap(InzhurSetupService, inzhurSetupService =>
                    inzhurSetupService.updateCashAccount(Struct.omit(values, ['type', 'currentBalance']), values.currentBalance)
                );
            }

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
        instrumentId: useController({ control, name: 'instrumentId' }),
        dividendPayout: useController({ control, name: 'dividendPayout' })
    };
    const stickyInstrument = useStickyDefinedValue(instrument);
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

    return (
        <UpdateAccountScreen
            account={account}
            allowNegativeBalance
            {...(isInzhurCash && { balanceFieldLabel: t`Actual balance` })}
            fields={fields}
            instrumentSymbol={stickyInstrument.symbol}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
        >
            {currencyField}
            {isSyncedAccount ? <AccountSyncCard accountId={account.id} /> : null}
            {isInzhurFund ? (
                <InzhurDividendPayoutField value={fields.dividendPayout.field.value} onChange={fields.dividendPayout.field.onChange} />
            ) : null}
            {isInzhurCash ? <InzhurActualBalanceNote /> : null}
        </UpdateAccountScreen>
    );
};
