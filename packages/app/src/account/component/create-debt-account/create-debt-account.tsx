import { AccountDebtTypeEnum, AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { AccountDebtOpeningService, DebtAccountService } from '@budgie/ledger';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { useState } from 'react';
import { useController } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { useStickyDefinedValue } from '../../../@generic/hook/use-sticky-defined-value.hook';
import { defaultInstrumentIdAtom } from '../../../settings/constants/settings-atoms.constant';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { useAccountCreateBindings } from '../../hooks/use-account-create-bindings.hook';
import { useDebtAccountForm } from '../../hooks/use-debt-account-form.hook';
import { getDebtOpeningMessages } from '../../utils/get-debt-opening-messages.util';
import { AccountFormDateField } from '../account-form-date-field/account-form-date-field';
import { AccountTargetBalanceField } from '../account-target-balance-field.tsx/account-target-balance-field';
import { CreateAccountCoreFields } from '../create-account-core-fields/create-account-core-fields';
import { CreateAccountScreen } from '../create-account-screen/create-account-screen';
import { DebtAccountContactField } from '../debt-account-contact-field/debt-account-contact-field';
import { DebtAccountTypeField } from '../debt-account-type-field/debt-account-type-field';
import { DebtOpeningAccountField } from '../debt-opening-account-field/debt-opening-account-field';

const DEFAULT_ICON = UserIconNameEnum.HandCoins;

export const CreateDebtAccount = () => {
    const defaultInstrumentId = useAtomValue(defaultInstrumentIdAtom);
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
        instrumentId: defaultInstrumentId
    };

    const { control, handleSubmit, instrument, debtType, isSubmitting } = useDebtAccountForm(initialValues, values =>
        isDefined(openingAccountId)
            ? Effect.flatMap(AccountDebtOpeningService, accountDebtOpeningService =>
                  accountDebtOpeningService.openDebtWithFundingAccount(values, openingAccountId, getDebtOpeningMessages())
              )
            : Effect.flatMap(DebtAccountService, debtAccountService => debtAccountService.createDebt(values))
    );
    const isLentDebt = debtType === AccountDebtTypeEnum.LENT;
    const variant = ACCOUNT_COLOR.DEBT;
    const fields = {
        ...useAccountCreateBindings(control, {
            title: 'title',
            icon: 'icon',
            currentBalance: 'currentBalance',
            instrumentId: 'instrumentId',
            includeInNetWorth: 'includeInNetWorth'
        }),
        targetBalance: useController({ control, name: 'targetBalance' }),
        debtType: useController({ control, name: 'debtType' }),
        contactId: useController({ control, name: 'contactId' }),
        deadline: useController({ control, name: 'deadline' })
    };
    const stickyInstrument = useStickyDefinedValue(instrument);
    const balanceFieldLabel = isLentDebt ? t`Already returned` : t`Already repaid`;
    const debtAmountLabel = isLentDebt ? t`Amount lent` : t`Amount borrowed`;
    const openingAccountLabel = isLentDebt ? t`From account` : t`To account`;

    if (!isDefined(stickyInstrument)) {
        return <EmptyScreen />;
    }

    return (
        <CreateAccountScreen title={t`Debt Account`} onSubmit={handleSubmit} isSubmitting={isSubmitting}>
            <CreateAccountCoreFields
                variant={variant}
                fields={fields}
                instrumentSymbol={stickyInstrument.symbol}
                balanceFieldLabel={balanceFieldLabel}
                namePlaceholder={t`e.g. Loan to Alex`}
            >
                <DebtOpeningAccountField
                    accountId={openingAccountId}
                    label={openingAccountLabel}
                    variant={variant}
                    onChange={setOpeningAccountId}
                />

                <AccountTargetBalanceField
                    value={fields.targetBalance.field.value}
                    onChange={fields.targetBalance.field.onChange}
                    instrumentSymbol={stickyInstrument.symbol}
                    label={debtAmountLabel}
                />

                <DebtAccountTypeField value={fields.debtType.field.value} onChange={fields.debtType.field.onChange} />

                <DebtAccountContactField
                    debtType={debtType}
                    value={fields.contactId.field.value}
                    onChange={fields.contactId.field.onChange}
                />

                <AccountFormDateField value={fields.deadline.field.value} onChange={fields.deadline.field.onChange} variant={variant} />
            </CreateAccountCoreFields>
        </CreateAccountScreen>
    );
};
