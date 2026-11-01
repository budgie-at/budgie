import { Text, View } from 'react-native';

import { FormAmountInput } from '../../../@generic/component/form-amount-input/form-amount-input';

interface Props {
    readonly label: string;
    readonly value: number;
    readonly currencySymbol: string;
    readonly testID: string;
    readonly onChange: (value: number) => void;
}

export const BudgetHeroAmountField = ({ label, value, currencySymbol, testID, onChange }: Props) => (
    <View>
        <Text className="text-secondary-foreground px-4 pt-md text-[13px] font-medium">{label}</Text>
        <FormAmountInput testID={testID} value={value} instrumentSymbol={currencySymbol} onChange={onChange} />
    </View>
);
