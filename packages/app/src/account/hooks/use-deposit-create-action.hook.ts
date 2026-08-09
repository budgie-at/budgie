import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useFormatDigits } from '../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../settings/context/settings.context';
import { useGetAccountByIdQuery } from '../query/use-get-account-by-id.query';
import { accountService } from '../service/account.service';

import type { AccountSelectorCreateActionInterface } from '../interface/account-selector-create-action.interface';

export const useDepositCreateAction = (
    isEnabled: boolean,
    sourceAccountId: number,
    sourceAmount: number
): AccountSelectorCreateActionInterface | null => {
    const { t } = useLingui();
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const { account: sourceAccount } = useGetAccountByIdQuery(isEnabled ? sourceAccountId : 0);

    const createDepositAccount = async (): Promise<number | null> => {
        if (!isDefined(sourceAccount)) {
            return null;
        }

        const createdAccount = await accountService.createDeposit({
            type: AccountTypeEnum.DEPOSIT,
            title: t`Deposit`,
            iban: null,
            icon: UserIconNameEnum.PiggyBank,
            instrumentId: sourceAccount.instrumentId,
            integrationId: sourceAccount.integrationId,
            includeInNetWorth: true,
            currentBalance: 0,
            interestRate: null,
            deadline: null
        });

        return createdAccount.id;
    };

    if (!isEnabled || !isDefined(sourceAccount)) {
        return null;
    }

    return {
        title: t`New deposit account`,
        subtitle: `${t`Funding amount`}: ${formatDigits(sourceAmount, sourceAccount.instrument.symbol)}`,
        errorMessage: t`Could not create deposit account`,
        onCreate: createDepositAccount
    };
};
