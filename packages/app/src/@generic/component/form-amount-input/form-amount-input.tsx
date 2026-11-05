import { AmountField, AmountFieldInput, AmountFieldPrefix, AmountFieldSuffix, useAmountSign } from '@budgie/amount-input';
import { ReactNode, useState } from 'react';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useAmountFormat } from '../../hook/use-amount-format.hook';
import { cn } from '../../utils/cn.util';
import { AmountSignCapsule } from '../amount-sign-capsule/amount-sign-capsule';

const DEFAULT_FONT_SIZE = 64;
const DISPLAY_FACE_FONT_SIZE = 40;
const FIELD_VERTICAL_PADDING = 40;

interface Props {
    readonly value: number;
    readonly testID?: string;
    readonly instrumentSymbol: string;
    readonly allowNegative?: boolean;
    readonly minimumDecimalPlaces?: number;
    readonly showInstrumentAfterAmount?: boolean;
    readonly onChange: (value: number) => void;
    readonly children?: ReactNode;
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
        children
    } = props;
    const format = useAmountFormat(minimumDecimalPlaces);
    const [isFocused, setIsFocused] = useState(false);
    const fontSize = isDefined(children) ? DISPLAY_FACE_FONT_SIZE : DEFAULT_FONT_SIZE;
    const isDisplayFaceShown = isDefined(children) && !isFocused;
    const fieldStyle = { height: fontSize + FIELD_VERTICAL_PADDING, borderCurve: 'continuous' as const };
    const focusClassName = isFocused ? 'border-default-foreground' : 'border-transparent';
    const handleFocus = () => void setIsFocused(true);
    const handleBlur = () => void setIsFocused(false);
    const { isNegative, absoluteValue, toggleSign, changeAbsoluteValue } = useAmountSign(value, onChange);

    const isNegativeAmount = allowNegative && isNegative;
    const isZero = absoluteValue === 0;
    const prefix = isNegativeAmount ? `−${instrumentSymbol}` : instrumentSymbol;
    const textAlign = showInstrumentAfterAmount ? 'right' : 'left';

    return (
        <View>
            <View
                className={cn('flex-row items-center rounded-3xl border-[1.5px] bg-surface-row px-3xl', focusClassName)}
                style={fieldStyle}
            >
                <AmountField fontSize={fontSize} className={cn('flex-1', isDisplayFaceShown && 'opacity-0')}>
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
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                    />

                    {showInstrumentAfterAmount ? (
                        <AmountFieldSuffix scale={0.4} minimumFontSize={22} className="text-primary">
                            {instrumentSymbol}
                        </AmountFieldSuffix>
                    ) : null}
                </AmountField>
                {isDisplayFaceShown ? (
                    <View pointerEvents="none" className="absolute inset-0 flex-row items-center px-3xl">
                        {children}
                    </View>
                ) : null}
            </View>

            {allowNegative ? <AmountSignCapsule isNegative={isNegative} isZero={isZero} onToggle={toggleSign} /> : null}
        </View>
    );
};
