import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { testID } from '../../../@generic/utils/test-id.util';
import { YIELD_GROUP_LABEL } from '../../constant/yield-group-label.constant';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldFilterChip } from '../yield-filter-chip/yield-filter-chip';

import type { YieldGroupEnum } from '@budgie/market';

interface Props {
    readonly group: YieldGroupEnum;
}

export const YieldKindFilterChip = ({ group }: Props) => {
    const { t } = useLingui();

    const label = t(YIELD_GROUP_LABEL[group]);
    const accessibilityLabel = t`Remove ${label} filter`;

    const handleClear = () => void router.setParams({ group: '' });

    return (
        <YieldFilterChip
            label={label}
            accessibilityLabel={accessibilityLabel}
            onPress={handleClear}
            {...testID(PassiveIncomeSelector.ClearFilter, 'kind')}
        />
    );
};
