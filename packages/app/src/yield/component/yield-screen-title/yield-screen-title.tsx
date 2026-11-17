import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { use } from 'react';
import { Pressable, Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { CHROME_TITLE_TEXT_PROPS } from '../../../@generic/constant/chrome-title-text-props.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { useYieldScopeTitle } from '../../hook/use-yield-scope-title.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

const CLEAR_HIT_SLOP = 14;

export const YieldScreenTitle = () => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);
    const scopeTitle = useYieldScopeTitle();

    const handleClear = () => void router.setParams({ position: '', instrument: '', group: '', focus: '' });

    const isFiltered = isDefined(screenKey.scopeId);
    const subtitle = isFiltered ? scopeTitle : t`All holdings`;

    return (
        <View className="gap-y-xs">
            <Text testID={PassiveIncomeSelector.Title} className="text-3xl font-semibold text-primary" {...CHROME_TITLE_TEXT_PROPS}>
                <Trans>Passive income</Trans>
            </Text>
            <View className="h-[20px] flex-row items-center gap-x-xs">
                <Text testID={PassiveIncomeSelector.Subtitle} className="text-xs text-secondary-foreground" numberOfLines={1}>
                    {subtitle}
                </Text>
                {isFiltered ? (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t`Show all holdings`}
                        hitSlop={CLEAR_HIT_SLOP}
                        onPress={handleClear}
                        testID={PassiveIncomeSelector.ClearFilter}
                    >
                        <Icon icon={UserIconNameEnum.CircleX} size={16} className="text-secondary-foreground" />
                    </Pressable>
                ) : null}
            </View>
        </View>
    );
};
