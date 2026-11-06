import { AmountField, AmountFieldInput, AmountFieldPrefix } from '@budgie/amount-input';
import { ReactNode, useState } from 'react';
import { View } from 'react-native';

import { useAmountFormat } from '../../../@generic/hook/use-amount-format.hook';
import { cn } from '../../../@generic/utils/cn.util';

const DISPLAY_FACE_FONT_SIZE = 40;
const FIELD_VERTICAL_PADDING = 40;

interface Props {
    readonly value: number;
    readonly testID?: string;
    readonly instrumentSymbol: string;
    readonly onChange: (value: number) => void;
    readonly children: ReactNode;
}

export const InzhurAmountInput = (props: Props) => {
    const { value, onChange, instrumentSymbol, testID, children } = props;
    const format = useAmountFormat(0);
    const [isFocused, setIsFocused] = useState(false);
    const isDisplayFaceShown = !isFocused;
    const fieldStyle = { height: DISPLAY_FACE_FONT_SIZE + FIELD_VERTICAL_PADDING, borderCurve: 'continuous' as const };
    const focusClassName = isFocused ? 'border-default-foreground' : 'border-transparent';
    const inputClassName = isDisplayFaceShown ? 'text-transparent' : 'text-primary';
    const placeholderClassName = isDisplayFaceShown ? 'accent-transparent' : 'accent-primary';
    const handleFocus = () => void setIsFocused(true);
    const handleBlur = () => void setIsFocused(false);

    return (
        <View className={cn('flex-row items-center rounded-3xl border-[1.5px] bg-surface-row px-3xl', focusClassName)} style={fieldStyle}>
            <AmountField fontSize={DISPLAY_FACE_FONT_SIZE} className="flex-1">
                <AmountFieldPrefix scale={1} className={cn('font-semibold text-primary', isDisplayFaceShown && 'opacity-0')}>
                    {instrumentSymbol}
                </AmountFieldPrefix>

                <AmountFieldInput
                    testID={testID}
                    value={value}
                    format={format}
                    onChangeValue={onChange}
                    className={cn('font-semibold tracking-[-1px] tabular-nums', inputClassName)}
                    placeholderTextColorClassName={placeholderClassName}
                    placeholder={format.format(0)}
                    textAlign="left"
                    selectTextOnFocus
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                />
            </AmountField>
            {isDisplayFaceShown ? (
                <View
                    pointerEvents="none"
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    className="absolute inset-0 flex-row items-center px-3xl"
                >
                    {children}
                </View>
            ) : null}
        </View>
    );
};
