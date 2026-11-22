import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { View } from 'react-native';

import { cn } from '../../../@generic/utils/cn.util';
import { testID } from '../../../@generic/utils/test-id.util';
import { YIELD_GROUP_LABEL } from '../../constant/yield-group-label.constant';
import { useYieldGroupColor } from '../../hook/use-yield-group-color.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldFilterChip } from '../yield-filter-chip/yield-filter-chip';

import type { YieldGroupEnum } from '@budgie/market';

interface Props {
    readonly group: YieldGroupEnum;
}

const DOT_CLASSNAME = 'size-[8px] rounded-full';

export const YieldKindFilterChip = ({ group }: Props) => {
    const { t } = useLingui();
    const { background } = useYieldGroupColor(group);

    const label = t(YIELD_GROUP_LABEL[group]);
    const accessibilityLabel = t`Remove ${label} filter`;

    const dotClassName = cn(DOT_CLASSNAME, background);

    const handleClear = () => void router.setParams({ group: '' });

    return (
        <YieldFilterChip
            label={label}
            accessibilityLabel={accessibilityLabel}
            leading={<View className={dotClassName} />}
            onPress={handleClear}
            {...testID(PassiveIncomeSelector.ClearFilter, 'kind')}
        />
    );
};
