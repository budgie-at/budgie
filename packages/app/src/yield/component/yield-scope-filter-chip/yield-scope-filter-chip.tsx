import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { use } from 'react';
import { View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { YieldScreenContext } from '../../context/yield-screen.context';
import { useYieldScopeTitle } from '../../hook/use-yield-scope-title.hook';
import { useYieldSummary } from '../../hook/use-yield-summary.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldFilterChip } from '../yield-filter-chip/yield-filter-chip';
import { YieldPositionIcon } from '../yield-position-icon/yield-position-icon';

const AVATAR_SIZE = 16;
const SOURCE_SIZE = 36;
const SCALED_STYLE = {
    width: SOURCE_SIZE,
    height: SOURCE_SIZE,
    margin: (AVATAR_SIZE - SOURCE_SIZE) / 2,
    transform: [{ scale: AVATAR_SIZE / SOURCE_SIZE }]
};

export const YieldScopeFilterChip = () => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);
    const scopeTitle = useYieldScopeTitle();
    const summary = useYieldSummary();

    const { positionAccountId } = screenKey.key;
    const position = isDefined(positionAccountId)
        ? summary?.positions.find(candidate => candidate.accountId === positionAccountId)
        : summary?.positions.at(0);
    const accessibilityLabel = isNotEmptyString(scopeTitle) ? t`Remove ${scopeTitle} filter` : t`Remove filter`;
    const avatar = isDefined(position) ? (
        <View className="size-[16px]" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <View style={SCALED_STYLE}>
                <YieldPositionIcon position={position} />
            </View>
        </View>
    ) : null;

    const handleClear = () => void router.setParams({ position: '', instrument: '', focus: '' });

    return (
        <YieldFilterChip
            label={scopeTitle}
            accessibilityLabel={accessibilityLabel}
            leading={avatar}
            onPress={handleClear}
            testID={PassiveIncomeSelector.ClearFilter}
            labelTestID={PassiveIncomeSelector.Subtitle}
        />
    );
};
