import { UserIconNameEnum } from '@budgie/contracts';
import { cn } from 'cn';
import { Pressable, Text } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly header: string;
    readonly isSelected: boolean;
    readonly onSelect: () => void;
    readonly testID?: string;
}

const baseClass = 'p-3xl rounded-xl flex-row items-center justify-between border'; // oxlint-disable-line lingui/no-unlocalized-strings
const selectedClass = 'bg-positive-background/10 border-positive-corner'; // oxlint-disable-line lingui/no-unlocalized-strings
const unselectedClass = 'border-secondary-corner bg-secondary-background/50'; // oxlint-disable-line lingui/no-unlocalized-strings

export const ImportColumnMapperOption = ({ header, isSelected, onSelect, testID }: Props) => {
    const pressableClassName = cn(baseClass, isSelected ? selectedClass : unselectedClass);
    const textClassName = cn('text-primary text-sm', isSelected && 'font-semibold'); // oxlint-disable-line lingui/no-unlocalized-strings

    return (
        <Pressable onPress={onSelect} className={pressableClassName} testID={testID}>
            <Text className={textClassName}>{header}</Text>
            {isSelected && <Icon icon={UserIconNameEnum.Check} size={16} className="text-positive-foreground" />}
        </Pressable>
    );
};
