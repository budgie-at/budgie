import { ComponentProps } from 'react';

import { useE2ERuntimeContext } from '../../../@e2e/context/e2e-runtime.context';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { useAppState } from '../../hook/use-app-state.hook';
import { useScreenshotProtection } from '../../hook/use-screenshot-protection.hook';
import { cn } from '../../utils/cn.util';
import { Ticker } from '../ticker/ticker';

interface Props extends Omit<ComponentProps<typeof Ticker>, 'number'> {
    readonly children: number;
    readonly className?: string;
    readonly decimalPlaces: number;
    readonly protectedText?: string;
    readonly instrumentSymbol: string;
}

export const ProtectedMoney = (props: Props) => {
    const { children, className, decimalPlaces, instrumentSymbol, protectedText = '$999.99', ...rest } = props;

    const showCents = useSetting('showCents');
    const { forceProtected } = useE2ERuntimeContext();

    const isScreenshotProtectionEnabled = useScreenshotProtection();
    const { isActive } = useAppState();

    const formatDigits = useFormatDigits(showCents ? 0 : decimalPlaces);

    const shouldProtect = (!isActive || forceProtected) && isScreenshotProtectionEnabled;
    const formatted = shouldProtect ? protectedText : formatDigits(children, instrumentSymbol);

    return (
        <Ticker hasAnimation={!shouldProtect} number={formatted} textClassName={cn('font-extralight text-primary', className)} {...rest} />
    );
};
