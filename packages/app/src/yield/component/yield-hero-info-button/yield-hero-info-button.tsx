import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { use } from 'react';
import { Pressable, useWindowDimensions } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

const BASE_SIZE = 18;
const MAX_SIZE = 28;
const HIT_AREA = 44;
const HALF = 2;

export const YieldHeroInfoButton = () => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);
    const { fontScale } = useWindowDimensions();

    const { range, positionAccountId, instrumentId, group } = screenKey.key;

    const size = Math.min(Math.max(Math.round(BASE_SIZE * fontScale), BASE_SIZE), MAX_SIZE);
    const hitSlop = Math.max((HIT_AREA - size) / HALF, 0);
    const sizeStyle = { width: size, height: size };

    const handlePress = () =>
        void router.push({
            pathname: '/passive-income-info',
            params: {
                range,
                ...(isDefined(positionAccountId) && { position: String(positionAccountId) }),
                ...(isDefined(instrumentId) && { instrument: String(instrumentId) }),
                ...(isDefined(group) && { group })
            }
        });

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={t`About these figures`}
            onPress={handlePress}
            hitSlop={hitSlop}
            className="items-center justify-center"
            style={sizeStyle}
            testID={PassiveIncomeSelector.Info}
        >
            <Icon icon={UserIconNameEnum.Info} size={size} className="text-secondary-foreground" />
        </Pressable>
    );
};
