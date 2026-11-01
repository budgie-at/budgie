import { ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { ReactElement, ReactNode } from 'react';

import { isDefined } from '@rnw-community/shared';

import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { CircleIcon } from '../circle-icon/circle-icon';

import { BinanceIcon } from './icons/binance-icon';
import { ErsteIcon } from './icons/erste-icon';
import { MonobankIcon } from './icons/monobank-icon';
import { PrivatbankIcon } from './icons/privatbank-icon';

interface Props {
    readonly bankProvider: ExternalSourceEnum;
    readonly size?: number;
    readonly variant?: ColorPaletteVariant;
    readonly fallback?: ReactNode;
}

const iconVariant = cva('', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
});

const getBankIcon = (provider: ExternalSourceEnum, size: number): ReactElement | null => {
    switch (provider) {
        case ExternalSourceEnum.MONOBANK:
            return <MonobankIcon size={size} />;
        case ExternalSourceEnum.PRIVATBANK:
            return <PrivatbankIcon size={size} />;
        case ExternalSourceEnum.ERSTE:
            return <ErsteIcon size={size} />;
        case ExternalSourceEnum.BINANCE:
            return <BinanceIcon size={size} />;
        case ExternalSourceEnum.MANUAL:
        case ExternalSourceEnum.REVOLUT:
        case ExternalSourceEnum.COINBASE:
        case ExternalSourceEnum.WISE:
        case ExternalSourceEnum.CSV:
        case ExternalSourceEnum.RECEIPT:
        case ExternalSourceEnum.APPLE_PAY_AUTOMATION:
        default:
            return null;
    }
};

export const BankLogo = ({ bankProvider, size = 32, variant = 'default', fallback }: Props) => {
    const icon = getBankIcon(bankProvider, size);

    if (isDefined(icon)) {
        return icon;
    }

    if (isDefined(fallback)) {
        return fallback;
    }

    return (
        <CircleIcon
            border={false}
            className="rounded-5xl w-13 h-13"
            icon={UserIconNameEnum.PiggyBank}
            iconClassName={iconVariant({ variant })}
            variant="ghost"
        />
    );
};
