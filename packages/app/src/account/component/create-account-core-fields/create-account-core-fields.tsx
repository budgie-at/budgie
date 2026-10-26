import { ReactNode } from 'react';

import { AccountDetailsField } from '../../../@generic/component/account-details-field/account-details-field';
import { CreateAccountCurrencyField } from '../../../@generic/component/create-account-currency-field/create-account-currency-field';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { AccountFormBindingsInterface } from '../../interface/account-form-bindings.interface';
import { AccountBalanceField } from '../account-balance-field/account-balance-field';
import { CreateAccountScreenSelector } from '../create-account-screen/create-account-screen.selector';
import { IncludeInNetWorthField } from '../include-in-net-worth-field/include-in-net-worth-field';

interface Props {
    readonly fields: Pick<AccountFormBindingsInterface, 'title' | 'icon' | 'currentBalance' | 'instrumentId' | 'includeInNetWorth'>;
    readonly variant: ColorPaletteVariant;
    readonly instrumentSymbol: string;
    readonly balanceFieldLabel?: string;
    readonly children?: ReactNode;
}

export const CreateAccountCoreFields = ({ fields, variant, instrumentSymbol, balanceFieldLabel, children }: Props) => (
    <>
        <AccountBalanceField
            variant={variant}
            instrumentSymbol={instrumentSymbol}
            value={fields.currentBalance.field.value}
            onChange={fields.currentBalance.field.onChange}
            label={balanceFieldLabel}
        />

        <FormLayoutGroup>
            <AccountDetailsField
                variant={variant}
                titleBinding={fields.title}
                iconBinding={fields.icon}
                nameInputTestID={CreateAccountScreenSelector.NameInput}
            />

            <CreateAccountCurrencyField value={fields.instrumentId.field.value} onChange={fields.instrumentId.field.onChange} />

            {children}

            <IncludeInNetWorthField value={fields.includeInNetWorth.field.value} onChange={fields.includeInNetWorth.field.onChange} />
        </FormLayoutGroup>
    </>
);
