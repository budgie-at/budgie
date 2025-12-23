import { CurrencyEnum } from '@budgie/contracts';
import { ComponentProps } from 'react';

import { useSettingsContext } from '../../../settings/context/settings.context';
import { useAppState } from '../../hooks/use-app-state.hook';
import { FormattedMoney } from '../formatted-money/formatted-money';

interface Props extends Omit<ComponentProps<typeof FormattedMoney>, 'children'> {
    readonly children: number;
    readonly currency: CurrencyEnum;
    readonly decimalPlaces: number;
}

const PLACEHOLDER_AMOUNT = 999.99;

export const ProtectedMoney = ({ children, currency, decimalPlaces, ...rest }: Props) => {
    const { settings } = useSettingsContext();
    const { isScreenshotProtectionEnabled } = settings;
    const { isBackground, isInactive } = useAppState();

    const shouldProtect = isScreenshotProtectionEnabled && (isBackground || isInactive);

    const displayValue = shouldProtect ? PLACEHOLDER_AMOUNT : children;

    return (
        <FormattedMoney currency={currency} decimalPlaces={decimalPlaces} {...rest}>
            {displayValue}
        </FormattedMoney>
    );
};
