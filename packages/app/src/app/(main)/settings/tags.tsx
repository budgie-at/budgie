import { TagEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { RefObject, useState } from 'react';

import { isNotEmptyString } from '@rnw-community/shared';

import { DeletableRow } from '../../../@generic/component/deletable-row/deletable-row';
import { SearchablePage } from '../../../@generic/component/searchable-page/searchable-page';
import { tagRepository } from '../../../@generic/drizzle/db/db';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { TagCard } from '../../../tag/components/tag-card/tag-card';
import { TagFormBottomSheet } from '../../../tag/components/tag-form-bottom-sheet/tag-form-bottom-sheet';
import { useSearchTagsQuery } from '../../../tag/query/use-search-tags.query';

export default function Tags() {
    const { t } = useLingui();
    const [search, setSearch] = useState('');
    const { tags } = useSearchTagsQuery(search);

    const handleDeleteTag = async (id: number) => {
        await tagRepository.deleteById(id);
    };

    const renderCard = (tag: TagEntityInterface, onOpen: (tag: TagEntityInterface) => void) => (
        <DeletableRow id={tag.id} onDelete={handleDeleteTag}>
            <TagCard onOpen={onOpen} tag={tag} />
        </DeletableRow>
    );

    const renderBottomSheet = (tag: TagEntityInterface | null, ref: RefObject<BottomSheetInterface | null>) => (
        <TagFormBottomSheet ref={ref} tag={tag} />
    );

    const emptyStateIcon = isNotEmptyString(search) ? 'Search' : 'Tag';
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
            renderBottomSheet={renderBottomSheet}
            renderCard={renderCard}
            search={search}
            onSearchChange={setSearch}
        />
    );
}
