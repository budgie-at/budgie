import { UserIconNameEnum } from '@budgie/contracts';
import { ComponentProps } from 'react';
import { ActivityIndicator } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props extends ComponentProps<typeof SimpleHorizontalCell> {
    readonly icon?: UserIconNameEnum;
    readonly variant?: ColorPaletteVariant;
    readonly isLoading?: boolean;
}

export const SettingsCard = ({ icon, variant, isLoading = false, disabled, right, left, ...rest }: Props) => {
    const rightSlot = isLoading ? <ActivityIndicator size="small" /> : right;
    const isDisabled = isLoading || disabled;
    const leftSlot = isDefined(icon) ? <CircleIcon icon={icon} variant={variant} border={false} size={36} iconSize={20} /> : left;

    return <SimpleHorizontalCell left={leftSlot} disabled={isDisabled} right={rightSlot} {...rest} />;
};
