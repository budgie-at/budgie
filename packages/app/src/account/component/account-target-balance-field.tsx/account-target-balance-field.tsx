import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { CreateAccountScreenSelector } from '../create-account-screen/create-account-screen.selector';

interface Props {
    readonly value: number;
    readonly onChange: (value: number) => void;
    readonly instrumentSymbol: string;
    readonly label: string;
}

export const AccountTargetBalanceField = ({ value, onChange, instrumentSymbol, label }: Props) => {
    const formatDigits = useDisplayFormatDigits();

    return (
        <FormItem label={label}>
            <AmountInput
                testID={CreateAccountScreenSelector.TargetBalanceInput}
                placeholder={formatDigits(0, instrumentSymbol)}
                size="lg"
                value={value}
                onChangeValue={onChange}
            />
        </FormItem>
    );
};
