import { View } from 'react-native';

import { YieldPositionIcon } from '../yield-position-icon/yield-position-icon';

import type { YieldPositionSummaryInterface } from '@budgie/market';

interface Props {
    readonly position: Pick<YieldPositionSummaryInterface, 'accountType' | 'instrumentCode' | 'instrumentType' | 'kind'>;
}

const AVATAR_SIZE = 16;
const SOURCE_SIZE = 36;
const SCALED_STYLE = {
    width: SOURCE_SIZE,
    height: SOURCE_SIZE,
    margin: (AVATAR_SIZE - SOURCE_SIZE) / 2,
    transform: [{ scale: AVATAR_SIZE / SOURCE_SIZE }]
};

export const YieldScopeChipAvatar = ({ position }: Props) => (
    <View className="size-[16px]" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={SCALED_STYLE}>
            <YieldPositionIcon position={position} />
        </View>
    </View>
);
