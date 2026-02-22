import { AccountDebtTypeEnum, AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
// jscpd:ignore-start
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { AccountFormSelectors } from '../../../@e2e/selectors/account-form.selector';
import { AccountDetailsField } from '../../../@generic/component/account-details-field/account-details-field';
import { CreateAccountCurrencyField } from '../../../@generic/component/create-account-currency-field/create-account-currency-field';
import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
// jscpd:ignore-end
import { useDebtAccountForm } from '../../hooks/use-debt-account-form.hook';
import { accountService } from '../../service/account.service';
import { AccountBalanceField } from '../account-balance-field/account-balance-field';
import { AccountFormDateField } from '../account-form-date-field/account-form-date-field';
import { AccountTargetBalanceField } from '../account-target-balance-field.tsx/account-target-balance-field';
import { CreateAccountScreen } from '../create-account-screen/create-account-screen';
import { DebtAccountContactField } from '../debt-account-contact-field/debt-account-contact-field';
import { DebtAccountTypeField } from '../debt-account-type-field/debt-account-type-field';

const DEFAULT_ICON = UserIconNameEnum.HandCoins;

export const CreateDebtAccount = () => {
    const { defaultInstrument } = useSettingsContext();
    const { t } = useLingui();

    const { control, handleSubmit, instrument } = useDebtAccountForm(
        {
            iban: '',
            title: '',
            deadline: null,
            contactId: null,
            targetBalance: 0,
            currentBalance: 0,
            icon: DEFAULT_ICON,
            type: AccountTypeEnum.DEBT,
            debtType: AccountDebtTypeEnum.LENT,
            instrumentId: defaultInstrument.id
        },
        async values => await accountService.createDebt(values)
    );

    if (!isDefined(instrument)) {
        return <EmptyScreen />;
    }

    return (
        <CreateAccountScreen variant={ACCOUNT_COLOR.DEBT} title={t`Debt Account`} onSubmit={handleSubmit}>
            <AccountBalanceField variant={ACCOUNT_COLOR.DEBT} instrumentSymbol={instrument.symbol} control={control} />

            <FormLayoutGroup>
                <AccountDetailsField variant={ACCOUNT_COLOR.DEBT} control={control} nameInputTestID={AccountFormSelectors.NameInput} />

                <CreateAccountCurrencyField control={control} />

                <AccountTargetBalanceField control={control} />

                <DebtAccountTypeField control={control} />

                <DebtAccountContactField control={control} />

                <AccountFormDateField control={control} variant={ACCOUNT_COLOR.DEBT} />
            </FormLayoutGroup>
        </CreateAccountScreen>
    );
};
