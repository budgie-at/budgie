import { TagEntityInterface } from '@budgie/contracts';
import { Text } from 'react-native';

interface Props {
    readonly tag: TagEntityInterface;
}

export const TagPillContent = ({ tag }: Props) => (
    <Text className="text-sm text-default-foreground px-xs shrink" numberOfLines={1}>
        {tag.title}
    </Text>
);
