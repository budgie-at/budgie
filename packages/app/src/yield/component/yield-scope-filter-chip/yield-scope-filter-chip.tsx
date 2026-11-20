import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { use } from 'react';

import { isDefined } from '@rnw-community/shared';

import { YieldScreenContext } from '../../context/yield-screen.context';
import { useYieldScopeTitle } from '../../hook/use-yield-scope-title.hook';
import { useYieldSummary } from '../../hook/use-yield-summary.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldFilterChip } from '../yield-filter-chip/yield-filter-chip';
import { YieldScopeChipAvatar } from '../yield-scope-chip-avatar/yield-scope-chip-avatar';

export const YieldScopeFilterChip = () => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);
    const scopeTitle = useYieldScopeTitle();
    const summary = useYieldSummary();

    const { positionAccountId } = screenKey.key;
    const position = isDefined(positionAccountId)
        ? summary?.positions.find(candidate => candidate.accountId === positionAccountId)
        : summary?.positions.at(0);
    const accessibilityLabel = t`Remove ${scopeTitle} filter`;
    const avatar = isDefined(position) ? <YieldScopeChipAvatar position={position} /> : null;

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
