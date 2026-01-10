import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef, useState } from 'react';

import { isNotEmptyString } from '@rnw-community/shared';

import { SearchablePage } from '../../../@generic/component/searchable-page/searchable-page';
import { tagRepository } from '../../../@generic/drizzle/db/db';
import { useCreateAction } from '../../../@generic/hook/use-create-action.hook';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { TagCard } from '../../../tag/components/tag-card/tag-card';
import { TagFormBottomSheet } from '../../../tag/components/tag-form-bottom-sheet/tag-form-bottom-sheet';
import { useSearchTagsQuery } from '../../../tag/query/use-search-tags.query';

export default function Tags() {
    const { t } = useLingui();

    const bottomSheetRef = useRef<BottomSheetInterface | null>(null);
    const [search, setSearch] = useState('');
    const [selectedTag, setSelectedTag] = useState<TagEntityInterface | null>(null);
    const { tags } = useSearchTagsQuery(search);

    const handleOpenCreate = () => {
        setSelectedTag(null);
        void bottomSheetRef.current?.open();
    };

    useCreateAction({
        icon: UserIconNameEnum.Tag,
        label: t`Tag`,
        variant: 'primary',
        onPress: handleOpenCreate
    });

    const handleDeleteTag = async (id: number) => {
        await tagRepository.deleteById(id);
    };

    const handleOpenTag = (tag: TagEntityInterface) => {
        setSelectedTag(tag);
        void bottomSheetRef.current?.open();
    };

    const renderCard = (tag: TagEntityInterface) => <TagCard onOpen={handleOpenTag} tag={tag} />;

    const emptyStateIcon = isNotEmptyString(search) ? UserIconNameEnum.Search : UserIconNameEnum.Tag;
    const emptyStateTitle = isNotEmptyString(search) ? t`No Results` : t`No Tags Yet`;
    const emptyStateDescription = isNotEmptyString(search) ? t`No tags match your search` : t`Create tags to organize your transactions`;

    const handleGoBack = () => void goBackOrReplace('/settings');

    return (
        <SearchablePage
            onGoBack={handleGoBack}
            onDelete={handleDeleteTag}
            title={t`Tags`}
            searchPlaceholder={t`Search tags...`}
            data={tags}
            emptyStateIcon={emptyStateIcon}
            emptyStateTitle={emptyStateTitle}
            emptyStateDescription={emptyStateDescription}
            renderCard={renderCard}
            search={search}
            onSearchChange={setSearch}
        >
            <TagFormBottomSheet ref={bottomSheetRef} tag={selectedTag} />
        </SearchablePage>
    );
}
