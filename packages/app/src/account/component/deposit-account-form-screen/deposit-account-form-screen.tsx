import { AccountTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ReactNode } from 'react';
import { Control, useController } from 'react-hook-form';

import { EmptyFn, isDefined } from '@rnw-community/shared';

import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { useStickyDefinedValue } from '../../../@generic/hook/use-sticky-defined-value.hook';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { useAccountCreateBindings } from '../../hooks/use-account-create-bindings.hook';
import { CreateAccountCoreFields } from '../create-account-core-fields/create-account-core-fields';
import { CreateAccountScreen } from '../create-account-screen/create-account-screen';
import { DepositMaturityDateField } from '../deposit-maturity-date-field/deposit-maturity-date-field';
import { ExpectedYieldField } from '../expected-yield-field/expected-yield-field';

import type { DepositAccountFormValues } from '../../interface/deposit-account-form-values.interface';
import type { InstrumentEntityInterface } from '@budgie/contracts';

interface Props {
    readonly title: string;
    readonly control: Control<DepositAccountFormValues>;
    readonly instrument: Pick<InstrumentEntityInterface, 'symbol'> | null;
    readonly onSubmit: EmptyFn;
    readonly isSubmitting: boolean;
    readonly balanceFieldLabel?: string;
    readonly children?: ReactNode;
    readonly onInstrumentChange?: (instrumentId: number) => void;
}

export const DepositAccountFormScreen = (props: Props) => {
    const { title, control, instrument, onSubmit, isSubmitting, balanceFieldLabel, children, onInstrumentChange } = props;
    const { t } = useLingui();
    const fields = useAccountCreateBindings(control, {
        title: 'title',
        icon: 'icon',
        currentBalance: 'currentBalance',
        instrumentId: 'instrumentId',
        includeInNetWorth: 'includeInNetWorth'
    });
    const interestRate = useController({ control, name: 'interestRate' });
    const variant = ACCOUNT_COLOR[AccountTypeEnum.DEPOSIT];
    const stickyInstrument = useStickyDefinedValue(instrument);

    if (!isDefined(stickyInstrument)) {
        return <EmptyScreen />;
    }

    return (
        <CreateAccountScreen title={title} onSubmit={onSubmit} isSubmitting={isSubmitting} accountName={fields.title.field.value}>
            {children}

            <CreateAccountCoreFields
                variant={variant}
                fields={fields}
                instrumentSymbol={stickyInstrument.symbol}
                balanceFieldLabel={balanceFieldLabel}
                namePlaceholder={t`e.g. 12-month deposit`}
                onInstrumentChange={onInstrumentChange}
            >
                <ExpectedYieldField
                    value={interestRate.field.value}
                    onChange={interestRate.field.onChange}
                    error={interestRate.fieldState.error?.message}
                />

                <DepositMaturityDateField control={control} variant={variant} />
            </CreateAccountCoreFields>
        </CreateAccountScreen>
    );
};
