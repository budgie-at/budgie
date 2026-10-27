import { ComponentProps, ReactNode } from 'react';

import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useIsAmountProtected } from '../../hook/use-is-amount-protected.hook';
import { cn } from '../../utils/cn.util';
import { Ticker } from '../ticker/ticker';

interface Props extends Omit<ComponentProps<typeof Ticker>, 'number' | 'children'> {
    readonly children: number;
    readonly className?: string;
    readonly containerClassName?: string;
    readonly protectedText?: string;
    readonly instrumentSymbol: string;
    readonly accessory?: ReactNode;
}

export const ProtectedMoney = (props: Props) => {
    const { children, className, containerClassName, instrumentSymbol, accessory, protectedText = '$999.99', ...rest } = props;

    const isAmountProtected = useIsAmountProtected();
    const formatDigits = useDisplayFormatDigits();

    const formatted = isAmountProtected ? protectedText : formatDigits(children, instrumentSymbol);

    return (
        <Ticker
            hasAnimation={!isAmountProtected}
            number={formatted}
            className={containerClassName}
            textClassName={cn('font-extralight text-primary', className)}
            {...rest}
        >
            {accessory}
        </Ticker>
    );
};
