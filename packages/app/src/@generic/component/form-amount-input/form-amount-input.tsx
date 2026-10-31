import { AmountField, AmountFieldInput, AmountFieldPrefix, AmountFieldSuffix, useAmountSign } from '@budgie/amount-input';
import { View } from 'react-native';

import { useAmountFormat } from '../../hook/use-amount-format.hook';
import { AmountSignCapsule } from '../amount-sign-capsule/amount-sign-capsule';

interface Props {
    readonly value: number;
    readonly testID?: string;
    readonly instrumentSymbol: string;
    readonly allowNegative?: boolean;
    readonly minimumDecimalPlaces?: number;
    readonly showInstrumentAfterAmount?: boolean;
    readonly onChange: (value: number) => void;
}

export const FormAmountInput = (props: Props) => {
    const {
        value,
        onChange,
        instrumentSymbol,
        allowNegative = false,
        minimumDecimalPlaces = 0,
        testID,
        showInstrumentAfterAmount = false
    } = props;
    const format = useAmountFormat(minimumDecimalPlaces);
    const { isNegative, absoluteValue, toggleSign, changeAbsoluteValue } = useAmountSign(value, onChange);

    const isNegativeAmount = allowNegative && isNegative;
    const isZero = absoluteValue === 0;
    const prefix = isNegativeAmount ? `−${instrumentSymbol}` : instrumentSymbol;
    const textAlign = showInstrumentAfterAmount ? 'right' : 'left';

    return (
        <View className="px-4">
            <View className="h-[104px] flex-row items-center">
                <AmountField fontSize={64} className="flex-1">
                    {showInstrumentAfterAmount ? null : (
                        <AmountFieldPrefix scale={0.6} className="text-primary">
                            {prefix}
                        </AmountFieldPrefix>
                    )}

                    <AmountFieldInput
                        testID={testID}
                        value={absoluteValue}
                        format={format}
                        onChangeValue={changeAbsoluteValue}
                        className="text-primary -ml-[12px] tabular-nums"
                        placeholderTextColorClassName="accent-primary"
                        placeholder={format.format(0)}
                        textAlign={textAlign}
                        selectTextOnFocus
                    />

                    {showInstrumentAfterAmount ? (
                        <AmountFieldSuffix scale={0.4} minimumFontSize={22} className="text-primary">
                            {instrumentSymbol}
                        </AmountFieldSuffix>
                    ) : null}
                </AmountField>
            </View>

            {allowNegative ? <AmountSignCapsule isNegative={isNegative} isZero={isZero} onToggle={toggleSign} /> : null}
        </View>
    );
};
