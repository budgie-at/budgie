import { isNotEmptyString } from '@rnw-community/shared';

import { FormAmountInput } from '../../../@generic/component/form-amount-input/form-amount-input';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { CreateAccountSelector } from '../../../app/(main)/create-account/create-account.selector';

interface Props {
    readonly value: number;
    readonly onChange: (value: number) => void;
    readonly instrumentSymbol: string;
    readonly variant: ColorPaletteVariant;
    readonly label?: string;
    readonly allowNegative?: boolean;
    readonly minimumDecimalPlaces?: number;
    readonly showInstrumentAfterAmount?: boolean;
}

export const AccountBalanceField = (props: Props) => {
    const { value, onChange, instrumentSymbol, variant, label, allowNegative, minimumDecimalPlaces, showInstrumentAfterAmount } = props;
    const amountInput = (
        <FormAmountInput
            testID={CreateAccountSelector.Amount}
            value={value}
            instrumentSymbol={instrumentSymbol}
            variant={variant}
            allowNegative={allowNegative}
            minimumDecimalPlaces={minimumDecimalPlaces}
            showInstrumentAfterAmount={showInstrumentAfterAmount}
            onChange={onChange}
        />
    );

    return isNotEmptyString(label) ? <FormItem label={label}>{amountInput}</FormItem> : amountInput;
};
