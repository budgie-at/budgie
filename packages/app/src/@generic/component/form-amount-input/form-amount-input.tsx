import { AmountField, AmountFieldInput, AmountFieldPrefix, AmountFieldSuffix, useAmountSign } from '@budgie/amount-input';
import { View } from 'react-native';

import { useAmountFormat } from '../../hook/use-amount-format.hook';
import { AmountSignCapsule } from '../amount-sign-capsule/amount-sign-capsule';

const DEFAULT_FONT_SIZE = 64;
const FIELD_VERTICAL_PADDING = 40;

interface Props {
    readonly value: number;
    readonly testID?: string;
    readonly instrumentSymbol: string;
    readonly allowNegative?: boolean;
    readonly minimumDecimalPlaces?: number;
    readonly showInstrumentAfterAmount?: boolean;
    readonly onChange: (value: number) => void;
    readonly fontSize?: number;
}

export const FormAmountInput = (props: Props) => {
    const {
        value,
        onChange,
        instrumentSymbol,
        allowNegative = false,
        minimumDecimalPlaces = 0,
        testID,
        showInstrumentAfterAmount = false,
        fontSize = DEFAULT_FONT_SIZE
    } = props;
    const format = useAmountFormat(minimumDecimalPlaces);
    const fieldStyle = { height: fontSize + FIELD_VERTICAL_PADDING };
    const { isNegative, absoluteValue, toggleSign, changeAbsoluteValue } = useAmountSign(value, onChange);

    const isNegativeAmount = allowNegative && isNegative;
    const isZero = absoluteValue === 0;
    const prefix = isNegativeAmount ? `−${instrumentSymbol}` : instrumentSymbol;
    const textAlign = showInstrumentAfterAmount ? 'right' : 'left';

    return (
        <View className="px-4">
            <View className="flex-row items-center border-b-2 border-surface-fill" style={fieldStyle}>
                <AmountField fontSize={fontSize} className="flex-1">
                    {showInstrumentAfterAmount ? null : (
                        <AmountFieldPrefix scale={1} className="font-semibold text-primary">
                            {prefix}
                        </AmountFieldPrefix>
                    )}

                    <AmountFieldInput
                        testID={testID}
                        value={absoluteValue}
                        format={format}
                        onChangeValue={changeAbsoluteValue}
                        className="font-semibold tracking-[-1px] text-primary tabular-nums"
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
