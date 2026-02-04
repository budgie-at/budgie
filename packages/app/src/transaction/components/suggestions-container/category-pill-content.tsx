import { CategoryEntityInterface } from '@budgie/contracts';
import { Text } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';

interface Props {
    readonly category: CategoryEntityInterface;
}

const PILL_ICON_SIZE = 24;
const PILL_ICON_INNER_SIZE = 12;
const PILL_ICON_RADIUS = 12;

export const CategoryPillContent = ({ category }: Props) => (
    <>
        <CircleIcon
            icon={category.icon}
            size={PILL_ICON_SIZE}
            iconSize={PILL_ICON_INNER_SIZE}
            radius={PILL_ICON_RADIUS}
            variant="secondary"
        />
        <Text className="text-sm text-default-foreground pr-xs shrink" numberOfLines={1}>
            {category.title}
        </Text>
    </>
);
