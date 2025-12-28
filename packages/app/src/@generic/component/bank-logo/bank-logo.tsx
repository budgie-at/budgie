import { BankProviderEnum } from '@budgie/bank-sync';
import { cva } from 'class-variance-authority';
import { Image } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { CircleIcon } from '../circle-icon/circle-icon';

interface Props {
    readonly bankProvider: BankProviderEnum;
    readonly variant?: ColorPaletteVariant;
}

const getLogo = (bank: Props['bankProvider']) => {
    switch (bank) {
        case BankProviderEnum.MONOBANK:
            // TODO: Is this the best way for the assets? Should we introduce a better approach?
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            return require('../../../../assets/icons/monobank.jpeg') as number;
        default:
            return null;
    }
};

const iconVariant = cva('', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
});

export const BankLogo = ({ bankProvider, variant = 'default' }: Props) => {
    const logo = getLogo(bankProvider);

    if (isDefined(logo)) {
        return <Image className="rounded-xl bg-black items-center justify-center w-13 h-13" source={logo} />;
    }

    return (
        <CircleIcon
            border={false}
            className="rounded-5xl w-13 h-13"
            icon="PiggyBank"
            iconClassName={iconVariant({ variant })}
            variant="ghost"
        />
    );
};
