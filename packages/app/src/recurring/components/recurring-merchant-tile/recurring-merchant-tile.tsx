import { UserIconNameEnum } from '@budgie/contracts';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { getRecurringTileVariant } from '../../utils/get-recurring-tile-variant.util';

import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly categoryId: number | null;
    readonly categoryIcon: UserIconType | null;
    readonly title: string;
    readonly size: number;
}

export const RecurringMerchantTile = ({ categoryId, categoryIcon, title, size }: Props) => (
    <CircleIcon
        size={size}
        iconSize={Math.round(size * 0.5)}
        radius={Math.round(size * 0.3)}
        border={false}
        icon={categoryIcon ?? UserIconNameEnum.Repeat}
        variant={getRecurringTileVariant(categoryId, title)}
    />
);
