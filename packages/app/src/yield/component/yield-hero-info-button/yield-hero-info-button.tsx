import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { use } from 'react';
import { Pressable } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

export const YieldHeroInfoButton = () => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);

    const { range, positionAccountId, instrumentId, group } = screenKey.key;

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
            className="-my-[13px] h-[44px] w-[44px] items-center justify-center"
            testID={PassiveIncomeSelector.Info}
        >
            <Icon icon={UserIconNameEnum.Info} size={18} className="text-secondary-foreground" />
        </Pressable>
    );
};
