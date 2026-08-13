import { UserIconNameEnum } from '@budgie/contracts';
import { ReactNode } from 'react';
import { Control } from 'react-hook-form';

import { AccountDetailsField } from '../../../@generic/component/account-details-field/account-details-field';
import { CreateAccountCurrencyField } from '../../../@generic/component/create-account-currency-field/create-account-currency-field';
import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { AccountBalanceField } from '../account-balance-field/account-balance-field';
import { CreateAccountScreenSelector } from '../create-account-screen/create-account-screen.selector';
import { IncludeInNetWorthField } from '../include-in-net-worth-field/include-in-net-worth-field';

interface Props<
    T extends {
        title: string;
        icon: UserIconNameEnum;
        instrumentId: number;
        currentBalance: number;
        includeInNetWorth?: boolean;
    }
> {
    readonly control: Control<T>;
    readonly variant: ColorPaletteVariant;
    readonly instrumentSymbol: string;
    readonly children?: ReactNode;
}

export const CreateAccountCoreFields = <
    T extends {
        title: string;
        icon: UserIconNameEnum;
        instrumentId: number;
        currentBalance: number;
        includeInNetWorth?: boolean;
    }
>({
    control,
    variant,
    instrumentSymbol,
    children
}: Props<T>) => (
    <>
        <AccountBalanceField variant={variant} instrumentSymbol={instrumentSymbol} control={control} />

        <FormLayoutGroup>
            <AccountDetailsField variant={variant} control={control} nameInputTestID={CreateAccountScreenSelector.NameInput} />

            <CreateAccountCurrencyField control={control} />

            {children}

            <IncludeInNetWorthField control={control} />
        </FormLayoutGroup>
    </>
);
