import { YieldRangeEnum } from '@budgie/market';
import { useAtomSet } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { use } from 'react';
import { Text } from 'react-native';

import { ActionsMenu } from '../../../@generic/component/actions-menu/actions-menu';
import { SegmentedControl } from '../../../@generic/component/segmented-control/segmented-control';
import { useIsLargeText } from '../../../@generic/hook/use-is-large-text.hook';
import { yieldRangeAtom } from '../../constant/yield-range-atom.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldSelectionContext } from '../../context/yield-selection.context';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldRangeMenuItem } from '../yield-range-menu-item/yield-range-menu-item';

export const YieldRangeControl = () => {
    const { t } = useLingui();
    const isLargeText = useIsLargeText();
    const setRange = useAtomSet(yieldRangeAtom);
    const { screenKey } = use(YieldScreenContext);
    const { cancelScrub } = use(YieldSelectionContext);

    const handleChange = (range: YieldRangeEnum) => {
        cancelScrub();
        setRange(range);
        router.setParams({ range, focus: '' });
    };

    const segments = [
        { value: YieldRangeEnum.MONTH, label: t`1M`, testID: PassiveIncomeSelector.Range(YieldRangeEnum.MONTH) },
        { value: YieldRangeEnum.QUARTER, label: t`3M`, testID: PassiveIncomeSelector.Range(YieldRangeEnum.QUARTER) },
        { value: YieldRangeEnum.YEAR, label: t`1Y`, testID: PassiveIncomeSelector.Range(YieldRangeEnum.YEAR) },
        { value: YieldRangeEnum.ALL, label: t`All`, testID: PassiveIncomeSelector.Range(YieldRangeEnum.ALL) }
    ];
    const currentLabel = segments.find(segment => segment.value === screenKey.key.range)?.label ?? '';

    if (isLargeText) {
        return (
            <ActionsMenu
                accessibilityLabel={t`Range, ${currentLabel}`}
                triggerTestID={PassiveIncomeSelector.RangeMenu}
                triggerClassName="min-h-[44px] items-center justify-center rounded-3xl bg-grouped-surface-row px-3xl"
                trigger={<Text className="text-md font-semibold text-primary">{currentLabel}</Text>}
            >
                {segments.map(segment => (
                    <YieldRangeMenuItem key={segment.value} range={segment.value} label={segment.label} onSelect={handleChange} />
                ))}
            </ActionsMenu>
        );
    }

    return <SegmentedControl segments={segments} value={screenKey.key.range} onChange={handleChange} />;
};
