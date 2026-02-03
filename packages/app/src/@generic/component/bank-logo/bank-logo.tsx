import { BankProviderEnum } from '@budgie/bank-sync';
import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { ReactElement } from 'react';

import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { CircleIcon } from '../circle-icon/circle-icon';

import { MonobankIcon } from './icons/monobank-icon';
import { PrivatbankIcon } from './icons/privatbank-icon';

interface Props {
    readonly bankProvider: BankProviderEnum;
    readonly size?: number;
    readonly variant?: ColorPaletteVariant;
}

const iconVariant = cva('', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
});

const getBankIcon = (provider: BankProviderEnum, size: number): ReactElement | null => {
    switch (provider) {
        case BankProviderEnum.MONOBANK:
            return <MonobankIcon size={size} />;
        case BankProviderEnum.PRIVATBANK:
            return <PrivatbankIcon size={size} />;
        default:
            return null;
    }
};

export const BankLogo = ({ bankProvider, size = 32, variant = 'default' }: Props) => {
    const icon = getBankIcon(bankProvider, size);

    if (icon !== null) {
        return icon;
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
