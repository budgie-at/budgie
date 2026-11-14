import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { AmountInput } from '../../../@generic/component/amount-input/amount-input';
import { FormItem } from '../../../@generic/component/form-item/form-item';
import { CreateAccountScreenSelector } from '../create-account-screen/create-account-screen.selector';

interface Props {
    readonly value: number | null;
    readonly onChange: (rate: number | null) => void;
    readonly error?: string;
    readonly hint?: string;
}

export const ExpectedYieldField = ({ value, onChange, error, hint }: Props) => {
    const { t } = useLingui();
    const handleChangeValue = (rate: number) => void onChange(isPositiveNumber(rate) ? rate : null);
    const hintText = isNotEmptyString(hint) ? <Text className="text-secondary-foreground text-xs">{hint}</Text> : null;

    return (
        <FormItem label={t`Interest Rate % (Optional)`} error={error}>
            <AmountInput
                testID={CreateAccountScreenSelector.InterestRateInput}
                value={value ?? 0}
                onChangeValue={handleChangeValue}
                placeholder={t`e.g. 5`}
                size="lg"
            />
            {hintText}
        </FormItem>
    );
};
