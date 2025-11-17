import { CurrencyEnum } from '@budgie/contracts';
import * as React from 'react';
import { ComponentProps } from 'react';

import { useFormatMoney } from '../../hooks/use-format-money.hook';
import { cn } from '../../utils/cn.util';
import { Ticker } from '../ticker/ticker';

interface Props extends Omit<ComponentProps<typeof Ticker>, 'number'> {
    readonly children: number;
    readonly className?: string;
    readonly decimalPlaces: number;
    readonly currency: CurrencyEnum;
}

export const FormattedMoney = ({ children, className, decimalPlaces, currency, ...rest }: Props) => {
    const format = useFormatMoney(decimalPlaces);

    const formatted = format(children, currency);

    return <Ticker number={formatted} textClassName={cn('font-extralight text-primary', className)} {...rest} />;
};
