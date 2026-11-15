import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { use } from 'react';
import { Pressable, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

export const YieldOpenPositionButton = () => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);

    const { positionAccountId, instrumentId } = screenKey.key;
    const isVisible = isDefined(screenKey.scopeId) && screenKey.from !== screenKey.scopeId;

    const handlePress = () => {
        if (isDefined(positionAccountId)) {
            router.push({ pathname: '/account/[id]/details', params: { id: String(positionAccountId) } });

            return;
        }

        if (isDefined(instrumentId)) {
            router.push({ pathname: '/currency/[id]', params: { id: String(instrumentId) } });
        }
    };

    return (
        <View className="h-[44px] w-[44px] items-center justify-center">
            {isVisible ? (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t`Open holding`}
                    onPress={handlePress}
                    testID={PassiveIncomeSelector.OpenPosition}
                >
                    <Icon icon={UserIconNameEnum.ArrowUpRight} size={20} className="text-primary" />
                </Pressable>
            ) : null}
        </View>
    );
};
