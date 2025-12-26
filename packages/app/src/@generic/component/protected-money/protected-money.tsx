import { CurrencyEnum } from '@budgie/contracts';
import { ComponentProps } from 'react';

import { useFormatMoney } from '../../../i18n/hook/use-format-money.hook';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { useAppState } from '../../hook/use-app-state.hook';
import { useScreenshotProtection } from '../../hook/use-screenshot-protection.hook';
import { cn } from '../../utils/cn.util';
import { Ticker } from '../ticker/ticker';

interface Props extends Omit<ComponentProps<typeof Ticker>, 'number'> {
    readonly children: number;
    readonly className?: string;
    readonly decimalPlaces: number;
    readonly currency: CurrencyEnum;
    readonly protectedText?: string;
}

export const ProtectedMoney = (props: Props) => {
    const { children, className, decimalPlaces, currency, protectedText = '$999.99', ...rest } = props;

    const showCents = useSetting('showCents');

    const isScreenshotProtectionEnabled = useScreenshotProtection();
    const { isActive } = useAppState();

    const format = useFormatMoney(showCents ? 0 : decimalPlaces, currency);

    const shouldProtect = !isActive && isScreenshotProtectionEnabled;
    const formatted = shouldProtect ? protectedText : format(children);

    return (
        <Ticker hasAnimation={!shouldProtect} number={formatted} textClassName={cn('font-extralight text-primary', className)} {...rest} />
    );
};
