import { useWindowDimensions } from 'react-native';

import { Icon } from '../icon/icon';

import type { ComponentProps } from 'react';

interface Props extends ComponentProps<typeof Icon> {
    readonly size: number;
}

const FONT_SCALE_LIMIT = 1.6;

export const ScaledIcon = ({ size, ...rest }: Props) => {
    const scaledSize = size * Math.min(useWindowDimensions().fontScale, FONT_SCALE_LIMIT);

    return <Icon {...rest} size={scaledSize} />;
};
