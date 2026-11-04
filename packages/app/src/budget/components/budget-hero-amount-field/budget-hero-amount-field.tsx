import { Control, FieldPathByValue, FieldValues, useController } from 'react-hook-form';
import { View } from 'react-native';

import { isNumber } from '@rnw-community/shared';

import { FormAmountInput } from '../../../@generic/component/form-amount-input/form-amount-input';
import { GroupedListSectionTitle } from '../../../@generic/component/grouped-list-section-title/grouped-list-section-title';

interface Props<TFieldValues extends FieldValues> {
    readonly label: string;
    readonly control: Control<TFieldValues>;
    readonly name: FieldPathByValue<TFieldValues, number>;
    readonly currencySymbol: string;
    readonly testID: string;
}

export const BudgetHeroAmountField = <TFieldValues extends FieldValues>({
    control,
    name,
    label,
    currencySymbol,
    testID
}: Props<TFieldValues>) => {
    const {
        field: { value, onChange }
    } = useController({ control, name });
    const amount = isNumber(value) ? value : 0;

    return (
        <View>
            <GroupedListSectionTitle title={label} />
            <FormAmountInput
                testID={testID}
                accessibilityLabel={label}
                value={amount}
                instrumentSymbol={currencySymbol}
                onChange={onChange}
            />
        </View>
    );
};
