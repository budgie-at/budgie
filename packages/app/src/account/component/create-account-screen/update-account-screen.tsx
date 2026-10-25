import { AccountEntityInterface, AccountTypeEnum } from '@budgie/contracts';
import { ReactNode } from 'react';

import { EmptyFn } from '@rnw-community/shared';

import { MICRO_UNIT_DECIMAL_PLACES } from '../../../@generic/constant/micro-unit-decimal-places.constant';
import { ACCOUNT_COLOR } from '../../constant/account-color.constant';
import { AccountFormBindingsInterface } from '../../interface/account-form-bindings.interface';
import { AccountBalanceField } from '../account-balance-field/account-balance-field';
import { UpdateAccountPage } from '../update-account-page/update-account-page';

interface Props {
    readonly account: AccountEntityInterface;
    readonly instrumentSymbol: string;
    readonly allowNegativeBalance?: boolean;
    readonly balanceFieldLabel?: string;
    readonly children?: ReactNode;
    readonly fields: Pick<AccountFormBindingsInterface, 'title' | 'icon' | 'currentBalance' | 'isActive'>;
    readonly onSubmit: EmptyFn;
    readonly isSubmitting?: boolean;
}

export const UpdateAccountScreen = (props: Props) => {
    const { children, account, onSubmit, fields, instrumentSymbol, allowNegativeBalance, balanceFieldLabel, isSubmitting } = props;

    const showInstrumentAfterAmount = account.type === AccountTypeEnum.CRYPTO || account.type === AccountTypeEnum.CRYPTO_SYNC;
    const minimumDecimalPlaces = showInstrumentAfterAmount ? MICRO_UNIT_DECIMAL_PLACES : 0;

    return (
        <UpdateAccountPage
            account={account}
            fields={fields}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            hero={
                <AccountBalanceField
                    variant={ACCOUNT_COLOR[account.type]}
                    instrumentSymbol={instrumentSymbol}
                    value={fields.currentBalance.field.value}
                    onChange={fields.currentBalance.field.onChange}
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
