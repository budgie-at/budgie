import { Trans, useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { use } from 'react';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { CHROME_TITLE_TEXT_PROPS } from '../../../@generic/constant/chrome-title-text-props.constant';
import { YIELD_GROUP_LABEL } from '../../constant/yield-group-label.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { useYieldScopeTitle } from '../../hook/use-yield-scope-title.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldFilterChip } from '../yield-filter-chip/yield-filter-chip';

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
        <View className="flex-row items-center justify-center gap-x-sm">
            <Text className="shrink-0 text-center text-lg font-semibold text-primary" {...CHROME_TITLE_TEXT_PROPS}>
                <Trans>Passive income</Trans>
            </Text>
            {isNotEmptyArray(scopes) ? (
                <YieldFilterChip
                    label={scopeText}
                    accessibilityLabel={accessibilityLabel}
                    onPress={handleClear}
                    testID={PassiveIncomeSelector.ClearFilter}
                />
            ) : null}
        </View>
    );
};
