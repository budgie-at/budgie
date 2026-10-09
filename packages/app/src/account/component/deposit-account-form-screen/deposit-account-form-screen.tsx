import { AccountTypeEnum } from '@budgie/contracts';
import { ReactNode } from 'react';
import { Control } from 'react-hook-form';

import { EmptyFn, isDefined } from '@rnw-community/shared';

import { EmptyScreen } from '../../../@generic/component/empty-screen/empty-screen';
import { useStickyDefinedValue } from '../../../@generic/hook/use-sticky-defined-value.hook';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { CreateAccountCoreFields } from '../create-account-core-fields/create-account-core-fields';
import { CreateAccountScreen } from '../create-account-screen/create-account-screen';
import { DepositInterestRateField } from '../deposit-interest-rate-field/deposit-interest-rate-field';
import { DepositMaturityDateField } from '../deposit-maturity-date-field/deposit-maturity-date-field';

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
}

export const DepositAccountFormScreen = ({ title, control, instrument, onSubmit, isSubmitting, balanceFieldLabel, children }: Props) => {
    const variant = ACCOUNT_COLOR[AccountTypeEnum.DEPOSIT];
    const stickyInstrument = useStickyDefinedValue(instrument);

    if (!isDefined(stickyInstrument)) {
        return <EmptyScreen />;
    }

    return (
        <CreateAccountScreen variant={variant} title={title} onSubmit={onSubmit} isSubmitting={isSubmitting}>
            {children}

            <CreateAccountCoreFields
                variant={variant}
                control={control}
                instrumentSymbol={stickyInstrument.symbol}
                balanceFieldLabel={balanceFieldLabel}
            >
                <DepositInterestRateField control={control} />

                <DepositMaturityDateField control={control} variant={variant} />
            </CreateAccountCoreFields>
        </CreateAccountScreen>
    );
};
