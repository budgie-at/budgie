import { useAtomValue } from '@effect/atom-react/Hooks';
import { ComponentProps, ReactNode } from 'react';

import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { decimalPlacesAtom } from '../../../settings/constants/settings-atoms.constant';
import { useIsAmountProtected } from '../../hook/use-is-amount-protected.hook';
import { cn } from '../../utils/cn.util';
import { Ticker } from '../ticker/ticker';

interface Props extends Omit<ComponentProps<typeof Ticker>, 'number' | 'children'> {
    readonly children: number;
    readonly className?: string;
    readonly protectedText?: string;
    readonly instrumentSymbol: string;
    readonly accessory?: ReactNode;
}

export const ProtectedMoney = (props: Props) => {
    const { children, className, instrumentSymbol, accessory, protectedText = '$999.99', ...rest } = props;

    const isAmountProtected = useIsAmountProtected();
    const formatDigits = useFormatDigits(useAtomValue(decimalPlacesAtom));

    const formatted = isAmountProtected ? protectedText : formatDigits(children, instrumentSymbol);

    return (
        <Ticker
            hasAnimation={!isAmountProtected}
            number={formatted}
            textClassName={cn('font-extralight text-primary', className)}
            {...rest}
        >
            {accessory}
        </Ticker>
    );
};
