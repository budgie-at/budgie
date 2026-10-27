import { AccountTypeEnum, InstrumentTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { AccountService } from '@budgie/ledger';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { AccountDetailsField } from '../../../@generic/component/account-details-field/account-details-field';
import { CreateAccountCurrencyField } from '../../../@generic/component/create-account-currency-field/create-account-currency-field';
import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { MICRO_UNIT_DECIMAL_PLACES } from '../../../@generic/constant/micro-unit-decimal-places.constant';
import { useStickyDefinedValue } from '../../../@generic/hook/use-sticky-defined-value.hook';
import { useGetInstrumentsByTypeQuery } from '../../../instrument/query/use-get-instruments-by-type.query';
import { HistoricalMarketDataDrainerService } from '../../../market-data/service/historical-market-data-drainer.service';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { useAccountCreateBindings } from '../../hooks/use-account-create-bindings.hook';
import { useLiabilityAccountForm } from '../../hooks/use-liability-account-form.hook';
import { AccountBalanceField } from '../account-balance-field/account-balance-field';
import { CreateAccountScreen } from '../create-account-screen/create-account-screen';
import { CreateAccountScreenSelector } from '../create-account-screen/create-account-screen.selector';
import { IncludeInNetWorthField } from '../include-in-net-worth-field/include-in-net-worth-field';

interface Props {
    readonly type: AccountTypeEnum.BANK | AccountTypeEnum.CASH | AccountTypeEnum.CRYPTO;
}

const TITLE: Record<Props['type'], MessageDescriptor> = {
    [AccountTypeEnum.BANK]: msg`Checking Account`,
    [AccountTypeEnum.CASH]: msg`Savings Account`,
    [AccountTypeEnum.CRYPTO]: msg`Crypto Account`
};

export const CreateSimpleAccount = ({ type }: Props) => {
    const { t } = useLingui();
    const isCrypto = type === AccountTypeEnum.CRYPTO;
    const instrumentType = isCrypto ? InstrumentTypeEnum.CRYPTO : InstrumentTypeEnum.FIAT;
    const { defaultInstrument } = useSettingsContext();
    const { instruments } = useGetInstrumentsByTypeQuery(instrumentType);
    const cryptoInstrumentId = instruments.at(0)?.id;

    const formValues = {
        type,
        title: '',
        currentBalance: 0,
        icon: isCrypto ? UserIconNameEnum.Coins : UserIconNameEnum.Home,
        includeInNetWorth: true,
        instrumentId: isDefined(cryptoInstrumentId) ? cryptoInstrumentId : defaultInstrument.id
    };

    const { control, handleSubmit, instrument, isSubmitting } = useLiabilityAccountForm(formValues, values =>
        Effect.gen(function* () {
            const accountService = yield* AccountService;
            const historicalMarketDataDrainerService = yield* HistoricalMarketDataDrainerService;
            const account = yield* accountService.create(values);

            yield* Effect.forkDetach(historicalMarketDataDrainerService.enqueueAccounts([account]).pipe(Effect.tapCause(Effect.logError)));

            return account;
        })
    );

    const fields = useAccountCreateBindings(control, {
        title: 'title',
        icon: 'icon',
        currentBalance: 'currentBalance',
        instrumentId: 'instrumentId',
        includeInNetWorth: 'includeInNetWorth'
    });
    const stickyInstrument = useStickyDefinedValue(instrument);

    if ((isCrypto && !isDefined(cryptoInstrumentId)) || !isDefined(stickyInstrument)) {
        return <EmptyScreen />;
    }

    const variant = ACCOUNT_COLOR[type];
    const minimumDecimalPlaces = isCrypto ? MICRO_UNIT_DECIMAL_PLACES : 0;

    return (
        <CreateAccountScreen title={t(TITLE[type])} variant={variant} onSubmit={handleSubmit} isSubmitting={isSubmitting}>
            <AccountBalanceField
                variant={variant}
                instrumentSymbol={stickyInstrument.symbol}
                value={fields.currentBalance.field.value}
                onChange={fields.currentBalance.field.onChange}
                allowNegative={!isCrypto}
                minimumDecimalPlaces={minimumDecimalPlaces}
                showInstrumentAfterAmount={isCrypto}
            />

            <FormLayoutGroup>
                <AccountDetailsField
                    variant={variant}
                    titleBinding={fields.title}
                    iconBinding={fields.icon}
                    nameInputTestID={CreateAccountScreenSelector.NameInput}
                />
                <CreateAccountCurrencyField
                    value={fields.instrumentId.field.value}
                    onChange={fields.instrumentId.field.onChange}
                    instrumentType={instrumentType}
                />
                <IncludeInNetWorthField value={fields.includeInNetWorth.field.value} onChange={fields.includeInNetWorth.field.onChange} />
            </FormLayoutGroup>
        </CreateAccountScreen>
    );
};
