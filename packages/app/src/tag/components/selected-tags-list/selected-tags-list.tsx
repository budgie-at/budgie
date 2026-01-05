import { TagEntityInterface } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { TagsSelectorCard } from '../tags-selector-card/tags-selector-card';

interface Props {
    readonly selectedTags: TagEntityInterface[];
    readonly onRemoveSelection: (tagId: number) => void;
}

export const SelectedTagsList = ({ selectedTags, onRemoveSelection }: Props) => {
    const selectedTagsCount = selectedTags.length;

    return (
        <View>
            <Text className="text-secondary-foreground uppercase mb-xl text-sm font-medium">
                <Trans>Selected {selectedTagsCount}</Trans>
            </Text>

            <View className="flex-row flex-wrap gap-xl">
                {selectedTags.map(({ id, title }) => (
                    <TagsSelectorCard variant="removable" key={id} title={title} id={id} onSelect={onRemoveSelection} isSelected />
                ))}
            </View>
        </View>
    );
};
