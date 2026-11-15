import { UserIconNameEnum } from '@budgie/contracts';

import { ActionsMenuItem } from '../../../@generic/component/actions-menu-item/actions-menu-item';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

import type { YieldRangeEnum } from '@budgie/market';

interface Props {
    readonly range: YieldRangeEnum;
    readonly label: string;
    readonly onSelect: (range: YieldRangeEnum) => void;
}

export const YieldRangeMenuItem = ({ range, label, onSelect }: Props) => {
    const handlePress = () => void onSelect(range);

    return (
        <ActionsMenuItem icon={UserIconNameEnum.Calendar} label={label} onPress={handlePress} testID={PassiveIncomeSelector.Range(range)} />
    );
};
