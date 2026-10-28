import { AccountTypeEnum } from '@budgie/contracts';
import { AccountService } from '@budgie/ledger';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useLocalSearchParams } from 'expo-router';

import { parsePositiveRouteParam } from '../../../@generic/utils/parse-positive-route-param.util';
import { defaultInstrumentIdAtom } from '../../../settings/constants/settings-atoms.constant';
import { ACCOUNT_ICON } from '../../constant/account-icon.constant';
import { useDepositAccountForm } from '../../hooks/use-deposit-account-form.hook';
import { DepositAccountFormScreen } from '../deposit-account-form-screen/deposit-account-form-screen';

export const CreateDepositAccount = () => {
    const defaultInstrumentId = useAtomValue(defaultInstrumentIdAtom);
    const { t } = useLingui();
    const { integrationId } = useLocalSearchParams<{ integrationId?: string | string[] }>();
    const parsedIntegrationId = parsePositiveRouteParam(integrationId);

    const initialValues = {
        iban: null,
        title: '',
        deadline: null,
        interestRate: null,
        currentBalance: 0,
        icon: ACCOUNT_ICON[AccountTypeEnum.DEPOSIT],
        includeInNetWorth: true,
        type: AccountTypeEnum.DEPOSIT,
        instrumentId: defaultInstrumentId,
        integrationId: parsedIntegrationId
    };

    const { control, handleSubmit, instrument, isSubmitting } = useDepositAccountForm(initialValues, values =>
        Effect.flatMap(AccountService, accountService => accountService.createDeposit(values))
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
