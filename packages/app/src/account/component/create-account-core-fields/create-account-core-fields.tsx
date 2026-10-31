import { ReactNode } from 'react';

import { FormLayoutGroup } from '../../../@generic/component/form-layout-group/form-layout-group';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { AccountFormBindingsInterface } from '../../interface/account-form-bindings.interface';
import { AccountBalanceField } from '../account-balance-field/account-balance-field';
import { CreateAccountDetailsSection } from '../create-account-details-section/create-account-details-section';
import { CreateAccountOptionsSection } from '../create-account-options-section/create-account-options-section';

interface Props {
    readonly fields: Pick<AccountFormBindingsInterface, 'title' | 'icon' | 'currentBalance' | 'instrumentId' | 'includeInNetWorth'>;
    readonly variant: ColorPaletteVariant;
    readonly instrumentSymbol: string;
    readonly balanceFieldLabel?: string;
    readonly namePlaceholder: string;
    readonly children?: ReactNode;
    readonly onInstrumentChange?: (instrumentId: number) => void;
}

export const CreateAccountCoreFields = (props: Props) => {
    const { fields, variant, instrumentSymbol, balanceFieldLabel, namePlaceholder, children, onInstrumentChange } = props;

    const handleInstrumentChange = (instrumentId: number) => {
        fields.instrumentId.field.onChange(instrumentId);
        onInstrumentChange?.(instrumentId);
    };

    return (
        <>
            <AccountBalanceField
                instrumentSymbol={instrumentSymbol}
                value={fields.currentBalance.field.value}
                onChange={fields.currentBalance.field.onChange}
                label={balanceFieldLabel}
            />

            <FormLayoutGroup>
                <CreateAccountDetailsSection
                    fields={fields}
                    variant={variant}
                    namePlaceholder={namePlaceholder}
                    onInstrumentChange={handleInstrumentChange}
                />

                {children}

                <CreateAccountOptionsSection
                    includeInNetWorth={fields.includeInNetWorth.field.value}
                    onIncludeInNetWorthChange={fields.includeInNetWorth.field.onChange}
                />
            </FormLayoutGroup>
        </>
    );
};
