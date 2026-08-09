import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useLocalSearchParams } from 'expo-router';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { useStickyDefinedValue } from '../../../@generic/hook/use-sticky-defined-value.hook';
import { normalizeRouteParam } from '../../../@generic/utils/normalize-route-param.util';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { useDepositAccountForm } from '../../hooks/use-deposit-account-form.hook';
import { accountService } from '../../service/account.service';
import { CreateAccountCoreFields } from '../create-account-core-fields/create-account-core-fields';
import { CreateAccountScreen } from '../create-account-screen/create-account-screen';
import { DepositInterestRateField } from '../deposit-interest-rate-field/deposit-interest-rate-field';
import { DepositMaturityDateField } from '../deposit-maturity-date-field/deposit-maturity-date-field';

const DEFAULT_ICON = UserIconNameEnum.PiggyBank;

export const CreateDepositAccount = () => {
    const { defaultInstrument } = useSettingsContext();
    const { t } = useLingui();
    const { integrationId } = useLocalSearchParams<{ integrationId?: string | string[] }>();
    const normalizedIntegrationId = normalizeRouteParam(integrationId);
    const parsedIntegrationIdValue = Number(normalizedIntegrationId);
    const parsedIntegrationId =
        isDefined(normalizedIntegrationId) && isPositiveNumber(parsedIntegrationIdValue) ? parsedIntegrationIdValue : null;

    const initialValues = {
        iban: null,
        title: '',
        deadline: null,
        interestRate: null,
        currentBalance: 0,
        icon: DEFAULT_ICON,
        includeInNetWorth: true,
        type: AccountTypeEnum.DEPOSIT,
        instrumentId: defaultInstrument.id,
        integrationId: parsedIntegrationId
    };

    const { control, handleSubmit, instrument, isSubmitting } = useDepositAccountForm(initialValues, values =>
        accountService.createDeposit(values)
    );

    const variant = ACCOUNT_COLOR[AccountTypeEnum.DEPOSIT];
    const stickyInstrument = useStickyDefinedValue(instrument);

    if (!isDefined(stickyInstrument)) {
        return <EmptyScreen />;
    }

    return (
        <CreateAccountScreen variant={variant} title={t`Deposit Account`} onSubmit={handleSubmit} isSubmitting={isSubmitting}>
            <CreateAccountCoreFields variant={variant} control={control} instrumentSymbol={stickyInstrument.symbol}>
                <DepositInterestRateField control={control} />

                <DepositMaturityDateField control={control} variant={variant} />
            </CreateAccountCoreFields>
        </CreateAccountScreen>
    );
};
