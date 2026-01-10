import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_MARGIN } from '../../constant/floating-tab-bar.constant';

interface Props {
    readonly multiplier?: number;
}

export const MenuSpacer = ({ multiplier = 1 }: Props) => {
    const { bottom } = useSafeAreaInsets();

    const style = { height: (FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_MARGIN) * multiplier + bottom };

    return <View style={style} />;
};
