import { AccountTypeEnum, InstrumentTypeEnum } from '@budgie/contracts';
import { AccountService } from '@budgie/ledger';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useController } from 'react-hook-form';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { MICRO_UNIT_DECIMAL_PLACES } from '../../../@generic/constant/micro-unit-decimal-places.constant';
import { useStickyDefinedValue } from '../../../@generic/hook/use-sticky-defined-value.hook';
import { useGetInstrumentsByTypeQuery } from '../../../instrument/query/use-get-instruments-by-type.query';
import { HistoricalMarketDataDrainerService } from '../../../market-data/service/historical-market-data-drainer.service';
import { defaultInstrumentIdAtom } from '../../../settings/constants/settings-atoms.constant';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { ACCOUNT_ICON } from '../../constant/account-icon.constant';
import { AccountSwitchFieldKindEnum } from '../../enum/account-switch-field-kind.enum';
import { useAccountCreateBindings } from '../../hooks/use-account-create-bindings.hook';
import { useLiabilityAccountForm } from '../../hooks/use-liability-account-form.hook';
import { AccountBalanceField } from '../account-balance-field/account-balance-field';
import { AccountSwitchField } from '../account-switch-field/account-switch-field';
import { CreateAccountDetailsSection } from '../create-account-details-section/create-account-details-section';
import { CreateAccountOptionsSection } from '../create-account-options-section/create-account-options-section';
import { CreateAccountScreen } from '../create-account-screen/create-account-screen';

interface Props {
    readonly type: AccountTypeEnum.BANK | AccountTypeEnum.CASH | AccountTypeEnum.CRYPTO;
}

const TITLE: Record<Props['type'], MessageDescriptor> = {
    [AccountTypeEnum.BANK]: msg`Checking Account`,
    [AccountTypeEnum.CASH]: msg`Savings Account`,
    [AccountTypeEnum.CRYPTO]: msg`Crypto Account`
};

const NAME_PLACEHOLDER: Record<Props['type'], MessageDescriptor> = {
    [AccountTypeEnum.BANK]: msg`e.g. Main card`,
    [AccountTypeEnum.CASH]: msg`e.g. Emergency fund`,
    [AccountTypeEnum.CRYPTO]: msg`e.g. Cold wallet`
};

// eslint-disable-next-line max-statements -- Form orchestration component with multiple hooks and handlers
export const CreateSimpleAccount = ({ type }: Props) => {
    const { t } = useLingui();
    const isCrypto = type === AccountTypeEnum.CRYPTO;
    const instrumentType = isCrypto ? InstrumentTypeEnum.CRYPTO : InstrumentTypeEnum.FIAT;
    const defaultInstrumentId = useAtomValue(defaultInstrumentIdAtom);
    const { instruments } = useGetInstrumentsByTypeQuery(instrumentType);
    const cryptoInstrumentId = instruments.at(0)?.id;

    const formValues = {
        type,
        title: '',
        currentBalance: 0,
        icon: ACCOUNT_ICON[type],
        includeInNetWorth: true,
        isActive: true,
        instrumentId: isDefined(cryptoInstrumentId) ? cryptoInstrumentId : defaultInstrumentId
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

    const fields = {
        ...useAccountCreateBindings(control, {
            title: 'title',
            icon: 'icon',
            currentBalance: 'currentBalance',
            instrumentId: 'instrumentId',
            includeInNetWorth: 'includeInNetWorth'
        }),
        isActive: useController({ control, name: 'isActive' })
    };
    const stickyInstrument = useStickyDefinedValue(instrument);

    if ((isCrypto && !isDefined(cryptoInstrumentId)) || !isDefined(stickyInstrument)) {
        return <EmptyScreen />;
    }

    const variant = ACCOUNT_COLOR[type];
    const hasTitle = isNotEmptyString(fields.title.field.value.trim());
    const minimumDecimalPlaces = isCrypto ? MICRO_UNIT_DECIMAL_PLACES : 0;

    return (
        <CreateAccountScreen title={t(TITLE[type])} onSubmit={handleSubmit} isSubmitting={isSubmitting} isSubmitDisabled={!hasTitle}>
            <AccountBalanceField
                label={t`Starting balance`}

                instrumentSymbol={stickyInstrument.symbol}
                value={fields.currentBalance.field.value}
                onChange={fields.currentBalance.field.onChange}
                allowNegative={!isCrypto}
                minimumDecimalPlaces={minimumDecimalPlaces}
                showInstrumentAfterAmount={isCrypto}
            />

            <FormLayoutGroup>
                <CreateAccountDetailsSection
                    fields={fields}
                    variant={variant}
                    namePlaceholder={t(NAME_PLACEHOLDER[type])}
                    instrumentType={instrumentType}
                    onInstrumentChange={fields.instrumentId.field.onChange}
                />

                <CreateAccountOptionsSection
                    includeInNetWorth={fields.includeInNetWorth.field.value}
                    onIncludeInNetWorthChange={fields.includeInNetWorth.field.onChange}
                >
                    <AccountSwitchField
                        kind={AccountSwitchFieldKindEnum.SHOW_ON_HOME}
                        value={fields.isActive.field.value}
                        onChange={fields.isActive.field.onChange}
                    />
                </CreateAccountOptionsSection>
            </FormLayoutGroup>
        </CreateAccountScreen>
    );
};
