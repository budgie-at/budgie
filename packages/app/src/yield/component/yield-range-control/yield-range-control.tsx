import { UserIconNameEnum } from '@budgie/contracts';
import { YieldRangeEnum } from '@budgie/market';
import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { use } from 'react';
import { Text, View } from 'react-native';

import { ActionsMenu } from '../../../@generic/component/actions-menu/actions-menu';
import { Icon } from '../../../@generic/component/icon/icon';
import { SegmentedControl } from '../../../@generic/component/segmented-control/segmented-control';
import { HapticPressFeedbackEnum } from '../../../@generic/enum/haptic-press-feedback.enum';
import { useIsLargeText } from '../../../@generic/hook/use-is-large-text.hook';
import { YIELD_RANGE_LABEL } from '../../constant/yield-range-label.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { useYieldRangeChange } from '../../hook/use-yield-range-change.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldRangeMenuItem } from '../yield-range-menu-item/yield-range-menu-item';

const MENU_LABEL = {
    [YieldRangeEnum.MONTH]: msg`1 month`,
    [YieldRangeEnum.QUARTER]: msg`3 months`,
    [YieldRangeEnum.YEAR]: msg`1 year`,
    [YieldRangeEnum.ALL]: msg`All time`
};

const RANGE_MAX_FONT_SIZE_MULTIPLIER = 1.4;

export const YieldRangeControl = () => {
    const { t } = useLingui();
    const isLargeText = useIsLargeText();
    const handleChange = useYieldRangeChange();
    const { screenKey } = use(YieldScreenContext);

    const segments = Object.values(YieldRangeEnum).map(range => ({
        value: range,
        label: t(YIELD_RANGE_LABEL[range]),
        testID: PassiveIncomeSelector.Range(range)
    }));
    const currentLabel = t(MENU_LABEL[screenKey.key.range]);

    if (isLargeText) {
        return (
            <View className="items-start">
                <ActionsMenu
                    accessibilityLabel={t`Range, ${currentLabel}`}
                    triggerTestID={PassiveIncomeSelector.RangeMenu}
                    triggerSize={44}
                    triggerClassName="min-h-[44px] items-center justify-center rounded-full bg-grouped-surface-row px-3xl"
                    trigger={
                        <View className="flex-row items-center gap-x-xs">
                            <Text className="text-md font-semibold text-primary" maxFontSizeMultiplier={RANGE_MAX_FONT_SIZE_MULTIPLIER}>
                                {currentLabel}
                            </Text>
                            <Icon icon={UserIconNameEnum.ChevronDown} size={16} className="text-secondary-foreground" />
                        </View>
                    }
                >
                    {Object.values(YieldRangeEnum).map(range => (
                        <YieldRangeMenuItem
                            key={range}
                            range={range}
                            label={t(MENU_LABEL[range])}
                            isCurrent={range === screenKey.key.range}
                            onSelect={handleChange}
                        />
                    ))}
                </ActionsMenu>
            </View>
        );
    }

    return (
        <SegmentedControl
            segments={segments}
            value={screenKey.key.range}
            onChange={handleChange}
            pressFeedback={HapticPressFeedbackEnum.NONE}
        />
    );
};
