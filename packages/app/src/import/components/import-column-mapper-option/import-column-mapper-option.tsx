import { Pressable, Text } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly header: string;
    readonly isSelected: boolean;
    readonly onSelect: () => void;
}

const baseClass = 'p-3xl rounded-xl flex-row items-center justify-between border'; // eslint-disable-line lingui/no-unlocalized-strings
const selectedClass = 'bg-positive-background/10 border-positive-corner'; // eslint-disable-line lingui/no-unlocalized-strings
const unselectedClass = 'border-secondary-corner bg-secondary-background/50'; // eslint-disable-line lingui/no-unlocalized-strings

export const ImportColumnMapperOption = ({ header, isSelected, onSelect }: Props) => {
    const pressableClassName = cn(baseClass, isSelected ? selectedClass : unselectedClass);
    const textClassName = cn('text-primary text-sm', isSelected && 'font-semibold'); // eslint-disable-line lingui/no-unlocalized-strings

    return (
        <Pressable onPress={onSelect} className={pressableClassName}>
            <Text className={textClassName}>{header}</Text>
            {isSelected && <Icon icon={ICONS.Check} size={16} className="text-positive-foreground" />}
        </Pressable>
    );
};
