/* jscpd:ignore-start */
import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { SearchablePage } from '../../../@generic/component/searchable-page/searchable-page';
import { useCreateAction } from '../../../@generic/hook/use-create-action.hook';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { TagCard } from '../../../tag/components/tag-card/tag-card';
import { TagEmptyState } from '../../../tag/components/tag-empty-state/tag-empty-state';
import { TagFormBottomSheet } from '../../../tag/components/tag-form-bottom-sheet/tag-form-bottom-sheet';
import { TagSelectorBottomSheet } from '../../../tag/components/tag-selector-bottom-sheet/tag-selector-bottom-sheet';
import { useSearchTagsQuery } from '../../../tag/query/use-search-tags.query';
import { tagService } from '../../../tag/service/tag.service';

const handleGoBack = () => void goBackOrReplace('/settings');

export default function Tags() {
    const { t } = useLingui();

    const bottomSheetRef = useRef<BottomSheetInterface | null>(null);
    const reassignRef = useRef<BottomSheetInterface | null>(null);
    const [search, setSearch] = useState('');
    const [selectedTag, setSelectedTag] = useState<TagEntityInterface | null>(null);
    const [tagToDelete, setTagToDelete] = useState<TagEntityInterface | null>(null);
    const { tags } = useSearchTagsQuery(search);

    const excludeTagIds = isDefined(tagToDelete) ? [tagToDelete.id] : [];

    useCreateAction({
        icon: UserIconNameEnum.Tag,
        label: t`Tag`,
        variant: 'primary',
        onPress: () => {
            setSelectedTag(null);
            void bottomSheetRef.current?.open();
        }
    });

    const handleDeleteTag = async (id: number) => {
        const count = await tagService.countTransactions(id);
        if (isPositiveNumber(count)) {
            const foundTag = tags?.find(item => item.id === id);
            if (isDefined(foundTag)) {
                setTagToDelete(foundTag);
                void reassignRef.current?.open();
            }

            return;
        }
        await tagService.deleteById(id);
    };

    const handleReassignSelect = async (targetTagId: number | null) => {
        if (isDefined(tagToDelete) && isDefined(targetTagId)) {
            await tagService.deleteWithReassignment(tagToDelete.id, targetTagId);
            void reassignRef.current?.close();
            setTagToDelete(null);
        }
    };

    const handleOpenTag = (tag: TagEntityInterface) => {
        setSelectedTag(tag);
        void bottomSheetRef.current?.open();
    };

    const renderCard = (tag: TagEntityInterface) => <TagCard onOpen={handleOpenTag} tag={tag} />;

    return (
        <SearchablePage
            onGoBack={handleGoBack}
            onDelete={handleDeleteTag}
            title={t`Tags`}
            searchPlaceholder={t`Search tags...`}
            data={tags}
            emptyState={<TagEmptyState search={search} />}
            renderCard={renderCard}
            search={search}
            onSearchChange={setSearch}
        >
            <TagFormBottomSheet ref={bottomSheetRef} tag={selectedTag} />

            {isDefined(tagToDelete) ? (
                <TagSelectorBottomSheet
                    ref={reassignRef}
                    selectedTag={null}
                    excludeTagIds={excludeTagIds}
                    description={t`This tag has transactions. Select another tag to reassign them to.`}
                    onSelect={handleReassignSelect}
                />
            ) : null}
        </SearchablePage>
    );
}
/* jscpd:ignore-end */
