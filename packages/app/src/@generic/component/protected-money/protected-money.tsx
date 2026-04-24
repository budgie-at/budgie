import { ComponentProps } from 'react';

import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useAppState } from '../../hook/use-app-state.hook';
import { useScreenshotProtection } from '../../hook/use-screenshot-protection.hook';
import { cn } from '../../utils/cn.util';
import { Ticker } from '../ticker/ticker';

interface Props extends Omit<ComponentProps<typeof Ticker>, 'number'> {
    readonly children: number;
    readonly className?: string;
    readonly protectedText?: string;
    readonly instrumentSymbol: string;
}

export const ProtectedMoney = (props: Props) => {
    const { children, className, instrumentSymbol, protectedText = '$999.99', ...rest } = props;

    const isScreenshotProtectionEnabled = useScreenshotProtection();
    const { isActive } = useAppState();

    const formatDigits = useDisplayFormatDigits();

    const shouldProtect = !isActive && isScreenshotProtectionEnabled;
    const formatted = shouldProtect ? protectedText : formatDigits(children, instrumentSymbol);

    return (
        <Ticker hasAnimation={!shouldProtect} number={formatted} textClassName={cn('font-extralight text-primary', className)} {...rest} />
    );
};
