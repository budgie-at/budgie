import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { useYieldScopeTitle } from '../../hook/use-yield-scope-title.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldFilterChip } from '../yield-filter-chip/yield-filter-chip';

export const YieldScopeFilterChip = () => {
    const { t } = useLingui();
    const scopeTitle = useYieldScopeTitle();

    const accessibilityLabel = t`Remove ${scopeTitle} filter`;

    const handleClear = () => void router.setParams({ position: '', instrument: '', focus: '' });

    return (
        <YieldFilterChip
            label={scopeTitle}
            accessibilityLabel={accessibilityLabel}
            onPress={handleClear}
            testID={PassiveIncomeSelector.ClearFilter}
            labelTestID={PassiveIncomeSelector.Subtitle}
        />
    );
};
