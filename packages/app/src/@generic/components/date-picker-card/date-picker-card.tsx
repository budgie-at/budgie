import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { ICONS } from '../../constant/icons.constant';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { Card } from '../card/card';
import { Icon } from '../icon/icon';

interface Props {
    readonly date: Date;
    readonly onPress: EmptyFn;
    readonly variant: ColorPaletteVariant;
}

const iconVariants = cva('', {
    variants: {
        variant: FOREGROUND_COLOR_PALETTE
    }
});

export const DatePickerCard = ({ variant, onPress, date }: Props) => (
    <Card onPress={onPress} className="flex-row items-center gap-x-xl">
        <Icon icon={ICONS.Calendar} size={16} className={iconVariants({ variant })} />

        <Text className="text-sm font-medium text-primary">{date.toLocaleDateString()}</Text>
    </Card>
);
