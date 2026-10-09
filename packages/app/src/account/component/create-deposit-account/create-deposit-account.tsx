import { AccountTypeEnum } from '@budgie/contracts';
import { AccountService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useLocalSearchParams } from 'expo-router';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { normalizeRouteParam } from '../../../@generic/utils/normalize-route-param.util';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { ACCOUNT_ICON } from '../../constant/account-icon.constant';
import { useDepositAccountForm } from '../../hooks/use-deposit-account-form.hook';
import { DepositAccountFormScreen } from '../deposit-account-form-screen/deposit-account-form-screen';

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
        icon: ACCOUNT_ICON[AccountTypeEnum.DEPOSIT],
        includeInNetWorth: true,
        type: AccountTypeEnum.DEPOSIT,
        instrumentId: defaultInstrument.id,
        integrationId: parsedIntegrationId
    };

    const { control, handleSubmit, instrument, isSubmitting } = useDepositAccountForm(initialValues, values =>
        appRuntime.runPromise(Effect.flatMap(AccountService, accountService => accountService.createDeposit(values)))
    );

    return (
        <DepositAccountFormScreen
            title={t`Deposit Account`}
            control={control}
            instrument={instrument}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
        />
    );
};
