import { TagEntityInterface } from '@budgie/contracts';
import { NotificationFeedbackType } from 'expo-haptics/src/Haptics.types';
import { useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedFlatList } from '../../../@generic/components/animated-flat-list/animated-flat-list';
import { DeletableRow } from '../../../@generic/components/deletable-row/deletable-row';
import { tagRepository } from '../../../@generic/drizzle/db/db';
import { useVibration } from '../../../@generic/hooks/use-vibration.hook';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { TagCard } from '../tag-card/tag-card';
import { TagFormBottomSheet } from '../tag-form-bottom-sheet/tag-form-bottom-sheet';

interface Props {
    tags: TagEntityInterface[];
}

const safeEdges = ['bottom'] as const;
const listFooter = <SafeAreaView edges={safeEdges} />;

const keyExtractor = (tag: TagEntityInterface) => tag.id.toString();

export const TagsList = ({ tags }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const [tag, setTag] = useState<TagEntityInterface | null>(null);

    const handleOpenTag = (tag: TagEntityInterface) => {
        setTag(tag);
        void ref.current?.open();
    };
    const [notify] = useVibration();

    const handleDeleteTag = async (id: number) => {
        await tagRepository.deleteById(id);
        notify(NotificationFeedbackType.Success);
    };

    const renderItem = (tag: TagEntityInterface) => (
        <DeletableRow id={tag.id} onDelete={handleDeleteTag}>
            <TagCard onOpen={handleOpenTag} tag={tag} />
        </DeletableRow>
    );

    const style = { paddingTop: 30, rowGap: 20 };

    return (
        <>
            <AnimatedFlatList
                className="flex-1"
                data={tags}
                contentContainerStyle={style}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                ListFooterComponent={listFooter}
            />

            <TagFormBottomSheet tag={tag} ref={ref} />
        </>
    );
};
