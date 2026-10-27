import { useAtomValue } from '@effect/atom-react/Hooks';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { decimalPlacesAtom } from '../../../settings/constants/settings-atoms.constant';
import { CreateAccountScreenSelector } from '../create-account-screen/create-account-screen.selector';

interface Props {
    readonly value: number;
    readonly onChange: (value: number) => void;
    readonly instrumentSymbol: string;
    readonly label: string;
}

export const AccountTargetBalanceField = ({ value, onChange, instrumentSymbol, label }: Props) => {
    const decimalPlaces = useAtomValue(decimalPlacesAtom);
    const formatDigits = useFormatDigits(decimalPlaces);

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
