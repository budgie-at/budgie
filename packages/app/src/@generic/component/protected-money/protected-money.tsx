import { cn } from 'cn';
import { ComponentProps } from 'react';

import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useIsAmountProtected } from '../../hook/use-is-amount-protected.hook';
import { Ticker } from '../ticker/ticker';

interface Props extends Omit<ComponentProps<typeof Ticker>, 'number'> {
    readonly children: number;
    readonly className?: string;
    readonly protectedText?: string;
    readonly instrumentSymbol: string;
}

export const ProtectedMoney = (props: Props) => {
    const { children, className, instrumentSymbol, protectedText = '$999.99', ...rest } = props;

    const isAmountProtected = useIsAmountProtected();
    const formatDigits = useDisplayFormatDigits();

    const formatted = isAmountProtected ? protectedText : formatDigits(children, instrumentSymbol);

    return (
        <Ticker
            hasAnimation={!isAmountProtected}
            number={formatted}
            textClassName={cn('font-extralight text-primary', className)}
            {...rest}
        />
    );
};
