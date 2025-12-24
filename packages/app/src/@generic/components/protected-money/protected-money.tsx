import { CurrencyEnum } from '@budgie/contracts';
import { usePreventScreenCapture } from 'expo-screen-capture';
import { ComponentProps } from 'react';

import { useFormatMoney } from '../../../i18n/hook/use-format-money.hook';
import { useSetting } from '../../../settings/hook/use-setting.hook';
import { useAppState } from '../../hooks/use-app-state.hook';
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
    const { children, className, decimalPlaces, currency, protectedText = '999.99', ...rest } = props;
    usePreventScreenCapture();

    const isScreenshotProtectionEnabled = useSetting('isScreenshotProtectionEnabled');
    const showCents = useSetting('showCents');

    const { isActive } = useAppState();

    const format = useFormatMoney(showCents ? 0 : decimalPlaces, currency);

    // eslint-disable-next-line lingui/no-unlocalized-strings
    const textClassName = cn('font-extralight text-primary', className);

    const shouldProtect = !isActive && isScreenshotProtectionEnabled;
    const formatted = shouldProtect ? protectedText : format(children);

    return <Ticker hasAnimation={!shouldProtect} number={formatted} textClassName={textClassName} {...rest} />;
};
