import { AccountDebtTypeEnum, AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
// jscpd:ignore-start
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { AccountDetailsField } from '../../../@generic/component/account-details-field/account-details-field';
import { CreateAccountCurrencyField } from '../../../@generic/component/create-account-currency-field/create-account-currency-field';
import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { useStickyDefinedValue } from '../../../@generic/hook/use-sticky-defined-value.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { ACCOUNT_DEBT_TYPE_COLOR } from '../../constant/account-debt-type-color.constant';
// jscpd:ignore-end
import { useDebtAccountForm } from '../../hooks/use-debt-account-form.hook';
import { accountDebtOpeningService } from '../../service/account-debt-opening.service';
import { accountService } from '../../service/account.service';
import { AccountBalanceField } from '../account-balance-field/account-balance-field';
import { AccountFormDateField } from '../account-form-date-field/account-form-date-field';
import { AccountTargetBalanceField } from '../account-target-balance-field.tsx/account-target-balance-field';
import { CreateAccountScreen } from '../create-account-screen/create-account-screen';
import { CreateAccountScreenSelector } from '../create-account-screen/create-account-screen.selector';
import { DebtAccountContactField } from '../debt-account-contact-field/debt-account-contact-field';
import { DebtAccountTypeField } from '../debt-account-type-field/debt-account-type-field';
import { DebtOpeningAccountField } from '../debt-opening-account-field/debt-opening-account-field';
import { IncludeInNetWorthField } from '../include-in-net-worth-field/include-in-net-worth-field';

const DEFAULT_ICON = UserIconNameEnum.HandCoins;

export const CreateDebtAccount = () => {
    const { defaultInstrument } = useSettingsContext();
    const { t } = useLingui();
    const [openingAccountId, setOpeningAccountId] = useState<number | null>(null);
    const initialValues = {
        iban: null,
        title: '',
        deadline: null,
        contactId: null,
        targetBalance: 0,
        currentBalance: 0,
        icon: DEFAULT_ICON,
        includeInNetWorth: false,
        type: AccountTypeEnum.DEBT,
        debtType: AccountDebtTypeEnum.LENT,
        instrumentId: defaultInstrument.id
    };

    const { control, handleSubmit, instrument, debtType, setValue, getValues, isSubmitting } = useDebtAccountForm(
        initialValues,
        async values => {
            const effectiveOpeningAccountId = values.debtType === AccountDebtTypeEnum.LENT ? openingAccountId : null;

            if (isDefined(effectiveOpeningAccountId)) {
                return accountDebtOpeningService.createLentDebtFromTransfer(
                    { ...values, targetBalance: values.currentBalance },
                    effectiveOpeningAccountId
                );
            }

            return accountService.createDebt(values);
        }
    );
    const isLentDebt = debtType === AccountDebtTypeEnum.LENT;
    const isOpeningFromAccount = isLentDebt && isDefined(openingAccountId);
    const variant = ACCOUNT_DEBT_TYPE_COLOR[debtType];
    const stickyInstrument = useStickyDefinedValue(instrument);

    const handleCreateDebtAccountSubmit = () => {
        if (isOpeningFromAccount) {
            setValue('targetBalance', getValues('currentBalance'), { shouldDirty: false, shouldValidate: false });
        }

        return handleSubmit();
    };

    if (!isDefined(stickyInstrument)) {
        return <EmptyScreen />;
    }

    return (
        <CreateAccountScreen variant={variant} title={t`Debt Account`} onSubmit={handleCreateDebtAccountSubmit} isSubmitting={isSubmitting}>
            <AccountBalanceField variant={variant} instrumentSymbol={stickyInstrument.symbol} control={control} />

            <FormLayoutGroup>
                <AccountDetailsField variant={variant} control={control} nameInputTestID={CreateAccountScreenSelector.NameInput} />

                <CreateAccountCurrencyField control={control} />

                {isLentDebt && <DebtOpeningAccountField accountId={openingAccountId} variant={variant} onChange={setOpeningAccountId} />}

                {!isOpeningFromAccount && <AccountTargetBalanceField control={control} instrumentSymbol={stickyInstrument.symbol} />}

                <DebtAccountTypeField control={control} />

                <DebtAccountContactField control={control} />

                <AccountFormDateField control={control} variant={variant} />

                <IncludeInNetWorthField control={control} />
            </FormLayoutGroup>
        </CreateAccountScreen>
    );
};
