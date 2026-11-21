import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { use } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedProps } from 'react-native-reanimated';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';
import { useScreenChrome } from '@rnw-community/react-native-screen-chrome';
import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { CHROME_TITLE_TEXT_PROPS } from '../../../@generic/constant/chrome-title-text-props.constant';
import { testID } from '../../../@generic/utils/test-id.util';
import { YIELD_GROUP_LABEL } from '../../constant/yield-group-label.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { useYieldScopeTitle } from '../../hook/use-yield-scope-title.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

const CLEAR_BUTTON_STYLE = { right: -72 };

export const YieldCollapsedTitle = () => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);
    const scopeTitle = useYieldScopeTitle();
    const { config } = useScreenChrome();
    const { scrollY } = useCollapsibleHeaderScroll();

    const clearButtonAnimatedProps = useAnimatedProps(() => ({
        pointerEvents: scrollY.get() >= config.smallTitleStart ? ('box-none' as const) : ('none' as const)
    }));

    const { group } = screenKey.key;
    const scopes = [isDefined(screenKey.scopeId) ? scopeTitle : null, isDefined(group) ? t(YIELD_GROUP_LABEL[group]) : null].filter(
        isDefined
    );

    const scopeText = scopes.join(' · ');
    const accessibilityLabel = t`Remove ${scopeText} filter`;

    const handleClear = () => void router.setParams({ position: '', instrument: '', group: '', focus: '' });

    if (!isNotEmptyArray(scopes)) {
        return (
            <Text className="text-center text-lg font-semibold text-primary" {...CHROME_TITLE_TEXT_PROPS}>
                <Trans>Passive income</Trans>
            </Text>
        );
    }

    return (
        <View className="items-center self-stretch">
            <Text className="text-center text-[17px] font-semibold text-primary" {...CHROME_TITLE_TEXT_PROPS}>
                {scopeText}
            </Text>
            <Text className="text-center text-xs text-secondary-foreground" {...CHROME_TITLE_TEXT_PROPS}>
                <Trans>Passive income</Trans>
            </Text>
            <Animated.View
                className="absolute top-1/2 -mt-[22px] h-[44px] min-w-[44px]"
                style={CLEAR_BUTTON_STYLE}
                animatedProps={clearButtonAnimatedProps}
            >
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={accessibilityLabel}
                    onPress={handleClear}
                    className="h-[44px] min-w-[44px] items-center justify-center"
                    {...testID(PassiveIncomeSelector.ClearFilter, 'collapsed')}
                >
                    <Text className="text-[15px] font-medium text-positive-action" numberOfLines={1} maxFontSizeMultiplier={1.4}>
                        <Trans>Show all</Trans>
                    </Text>
                </Pressable>
            </Animated.View>
        </View>
    );
};
