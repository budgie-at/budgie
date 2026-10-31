import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { FormAmountInput } from '../../../@generic/component/form-amount-input/form-amount-input';
import { CreateAccountSelector } from '../../../app/(main)/create-account/create-account.selector';

interface Props {
    readonly value: number;
    readonly onChange: (value: number) => void;
    readonly instrumentSymbol: string;
    readonly label?: string;
    readonly allowNegative?: boolean;
    readonly minimumDecimalPlaces?: number;
    readonly showInstrumentAfterAmount?: boolean;
}

export const AccountBalanceField = (props: Props) => {
    const { value, onChange, instrumentSymbol, label, allowNegative, minimumDecimalPlaces, showInstrumentAfterAmount } = props;
    const { t } = useLingui();
    const caption = label ?? t`Current balance`;

    return (
        <View className="pb-5xl">
            <Text className="text-secondary-foreground px-4 pt-md text-[13px] font-medium">{caption}</Text>
            <FormAmountInput
                testID={CreateAccountSelector.Amount}
                value={value}
                instrumentSymbol={instrumentSymbol}
                allowNegative={allowNegative}
                minimumDecimalPlaces={minimumDecimalPlaces}
                showInstrumentAfterAmount={showInstrumentAfterAmount}
                onChange={onChange}
            />
        </View>
    );
};
