import { AccountDebtTypeEnum, AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
// jscpd:ignore-start
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { useStickyDefinedValue } from '../../../@generic/hook/use-sticky-defined-value.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
// jscpd:ignore-end
import { useDebtAccountForm } from '../../hooks/use-debt-account-form.hook';
import { accountDebtOpeningService } from '../../service/account-debt-opening.service';
import { accountService } from '../../service/account.service';
import { AccountFormDateField } from '../account-form-date-field/account-form-date-field';
import { AccountTargetBalanceField } from '../account-target-balance-field.tsx/account-target-balance-field';
import { CreateAccountCoreFields } from '../create-account-core-fields/create-account-core-fields';
import { CreateAccountScreen } from '../create-account-screen/create-account-screen';
import { DebtAccountContactField } from '../debt-account-contact-field/debt-account-contact-field';
import { DebtAccountTypeField } from '../debt-account-type-field/debt-account-type-field';
import { DebtOpeningAccountField } from '../debt-opening-account-field/debt-opening-account-field';

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

    const { control, handleSubmit, instrument, debtType, isSubmitting } = useDebtAccountForm(initialValues, async values => {
        if (isDefined(openingAccountId)) {
            return accountDebtOpeningService.openDebtWithFundingAccount(values, openingAccountId);
        }

        return accountService.createDebt(values);
    });
    const isLentDebt = debtType === AccountDebtTypeEnum.LENT;
    const variant = ACCOUNT_COLOR.DEBT;
    const stickyInstrument = useStickyDefinedValue(instrument);
    const balanceFieldLabel = isLentDebt ? t`Already returned` : t`Already repaid`;
    const openingAccountLabel = isLentDebt ? t`From account` : t`To account`;

    if (!isDefined(stickyInstrument)) {
        return <EmptyScreen />;
    }

    return (
        <CreateAccountScreen variant={variant} title={t`Debt Account`} onSubmit={handleSubmit} isSubmitting={isSubmitting}>
            <CreateAccountCoreFields
                variant={variant}
                control={control}
                instrumentSymbol={stickyInstrument.symbol}
                balanceFieldLabel={balanceFieldLabel}
            >
                <DebtOpeningAccountField
                    accountId={openingAccountId}
                    label={openingAccountLabel}
                    variant={variant}
                    onChange={setOpeningAccountId}
                />

                <AccountTargetBalanceField control={control} instrumentSymbol={stickyInstrument.symbol} />

                <DebtAccountTypeField control={control} />

                <DebtAccountContactField control={control} />

                <AccountFormDateField control={control} variant={variant} />
            </CreateAccountCoreFields>
        </CreateAccountScreen>
    );
};
