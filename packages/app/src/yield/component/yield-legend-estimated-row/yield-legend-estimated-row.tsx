import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { cn } from '../../../@generic/utils/cn.util';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

const ESTIMATED_KEY = 'ESTIMATED';

const ROW_CLASSNAME = 'min-h-[44px] flex-row items-center gap-x-sm py-xs';
const FULL_WIDTH_CLASSNAME = 'w-full';
const HALF_WIDTH_CLASSNAME = 'w-1/2';

interface Props {
    readonly isFullWidth: boolean;
}

export const YieldLegendEstimatedRow = ({ isFullWidth }: Props) => {
    const rowClassName = cn(ROW_CLASSNAME, isFullWidth ? FULL_WIDTH_CLASSNAME : HALF_WIDTH_CLASSNAME);

    return (
        <View accessible testID={PassiveIncomeSelector.LegendRow(ESTIMATED_KEY)} className={rowClassName}>
            <View className="h-[10px] w-[10px] rounded-full border-[1.5px] border-secondary-foreground bg-secondary-foreground/25" />
            <Text numberOfLines={1} className="flex-1 text-sm text-primary">
                <Trans>Estimated</Trans>
            </Text>
        </View>
    );
};
