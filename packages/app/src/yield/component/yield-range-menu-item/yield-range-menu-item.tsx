import { UserIconNameEnum } from '@budgie/contracts';

import { ActionsMenuItem } from '../../../@generic/component/actions-menu-item/actions-menu-item';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

import type { YieldRangeEnum } from '@budgie/market';

interface Props {
    readonly range: YieldRangeEnum;
    readonly label: string;
    readonly isCurrent: boolean;
    readonly onSelect: (range: YieldRangeEnum) => void;
}

export const YieldRangeMenuItem = ({ range, label, isCurrent, onSelect }: Props) => {
    const handlePress = () => void onSelect(range);

    const icon = isCurrent ? UserIconNameEnum.Check : UserIconNameEnum.Calendar;

    return <ActionsMenuItem icon={icon} label={label} onPress={handlePress} testID={PassiveIncomeSelector.Range(range)} />;
};
