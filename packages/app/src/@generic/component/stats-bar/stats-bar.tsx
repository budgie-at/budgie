import { View, ViewStyle } from 'react-native';

import { statsBarVariants } from '../../constant/stats-variants.constant';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';

interface Props {
    readonly percentage: number;
    readonly variant: ColorPaletteVariant;
}

export const StatsBar = ({ percentage, variant }: Props) => {
    const style: ViewStyle = { width: `${percentage}%` };

    return (
        <View className="rounded-5xl bg-secondary-corner h-2">
            <View style={style} className={statsBarVariants({ variant })} />
        </View>
    );
};
