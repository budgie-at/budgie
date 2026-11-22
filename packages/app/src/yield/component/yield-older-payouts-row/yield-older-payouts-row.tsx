import { YieldRangeEnum } from '@budgie/market';
import { useLingui } from '@lingui/react/macro';

import { useYieldRangeChange } from '../../hook/use-yield-range-change.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldRowSurface } from '../yield-row-surface/yield-row-surface';
import { YieldRow } from '../yield-row/yield-row';

export const YieldOlderPayoutsRow = () => {
    const { t } = useLingui();
    const changeRange = useYieldRangeChange();

    const title = t`Older payouts · All time`;

    const handlePress = () => void changeRange(YieldRangeEnum.ALL);

    return (
        <YieldRowSurface>
            <YieldRow title={title} accessibilityLabel={title} onPress={handlePress} testID={PassiveIncomeSelector.OlderPayouts} />
        </YieldRowSurface>
    );
};
