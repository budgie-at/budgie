import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { use } from 'react';
import { Pressable, Text, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { CHROME_TITLE_TEXT_PROPS } from '../../../@generic/constant/chrome-title-text-props.constant';
import { YIELD_GROUP_LABEL } from '../../constant/yield-group-label.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { useYieldScopeTitle } from '../../hook/use-yield-scope-title.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

const HIT_SLOP = { top: 8, bottom: 8, left: 12, right: 12 };

export const YieldCollapsedTitle = () => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);
    const scopeTitle = useYieldScopeTitle();

    const { group } = screenKey.key;
    const scopes = [isDefined(screenKey.scopeId) ? scopeTitle : null, isDefined(group) ? t(YIELD_GROUP_LABEL[group]) : null].filter(
        isDefined
    );

    const scopeText = scopes.join(' · ');
    const accessibilityLabel = t`Remove ${scopeText} filter`;

    const handleClear = () => void router.setParams({ position: '', instrument: '', group: '', focus: '' });

    return (
        <View className="items-center">
            <Text className="text-center text-lg font-semibold text-primary" {...CHROME_TITLE_TEXT_PROPS}>
                <Trans>Passive income</Trans>
            </Text>
            {isNotEmptyArray(scopes) ? (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={accessibilityLabel}
                    onPress={handleClear}
                    hitSlop={HIT_SLOP}
                    className="min-h-[44px] -my-[14px] flex-row items-center justify-center gap-x-xxs active:opacity-70"
                    testID={PassiveIncomeSelector.ClearFilter}
                >
                    <Text className="shrink text-center text-xs text-secondary-foreground" {...CHROME_TITLE_TEXT_PROPS}>
                        {scopeText}
                    </Text>
                    <Icon icon={UserIconNameEnum.X} size={12} className="text-secondary-foreground" />
                </Pressable>
            ) : null}
        </View>
    );
};
