import { UserIconNameEnum } from '@budgie/contracts';

import { EmptyFn } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { FilterRow } from '../../../@generic/component/filter-sheet/filter-row/filter-row';
import { FilterRowTitle } from '../../../@generic/component/filter-sheet/filter-row-title/filter-row-title';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly isSelected: boolean;
    readonly onPress: EmptyFn;
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly testID?: string;
}

export const TransactionFilterCard = ({ isSelected, onPress, icon, label, variant, testID }: Props) => {
    const iconVariant = isSelected ? variant : 'secondary';

    return (
        <FilterRow isSelected={isSelected} onPress={onPress} testID={testID}>
            <CircleIcon icon={icon} variant={iconVariant} size={32} iconSize={16} />
            <FilterRowTitle>{label}</FilterRowTitle>
        </FilterRow>
    );
};
