import {
    AccountEntityInterface,
    AccountTypeEnum,
    DebtAccountCreateInputInterface,
    LiabilityAccountCreateInputInterface
} from '@budgie/contracts';
import { ReactNode } from 'react';
import { Control, FieldValues } from 'react-hook-form';

import { EmptyFn } from '@rnw-community/shared';

import { MICRO_UNIT_DECIMAL_PLACES } from '../../../@generic/constant/micro-unit-decimal-places.constant';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { AccountBalanceField } from '../account-balance-field/account-balance-field';
import { UpdateAccountPage } from '../update-account-page/update-account-page';

interface Props<T extends FieldValues> {
    readonly account: AccountEntityInterface;
    readonly instrumentSymbol: string;
    readonly allowNegativeBalance?: boolean;
    readonly balanceFieldLabel?: string;
    readonly children?: ReactNode;
    readonly control: Control<T>;
    readonly onSubmit: EmptyFn;
    readonly isSubmitting?: boolean;
}

export const UpdateAccountScreen = <T extends LiabilityAccountCreateInputInterface | DebtAccountCreateInputInterface>(props: Props<T>) => {
    const { children, account, onSubmit, control, instrumentSymbol, allowNegativeBalance, balanceFieldLabel, isSubmitting } = props;

    const showInstrumentAfterAmount = account.type === AccountTypeEnum.CRYPTO || account.type === AccountTypeEnum.CRYPTO_SYNC;
    const minimumDecimalPlaces = showInstrumentAfterAmount ? MICRO_UNIT_DECIMAL_PLACES : 0;

    return (
        <UpdateAccountPage
            account={account}
            control={control}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            hero={
                <AccountBalanceField
                    variant={ACCOUNT_COLOR[account.type]}
                    instrumentSymbol={instrumentSymbol}
                    control={control}
                    label={balanceFieldLabel}
                    allowNegative={allowNegativeBalance}
                    minimumDecimalPlaces={minimumDecimalPlaces}
                    showInstrumentAfterAmount={showInstrumentAfterAmount}
                />
            }
        >
            {children}
        </UpdateAccountPage>
    );
};
