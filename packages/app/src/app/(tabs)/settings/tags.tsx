/* jscpd:ignore-start */
import { TagEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import Toast from 'react-native-toast-message';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { TagPageSelectors } from '../../../@e2e/selectors/tag-page.selector';
import { SearchablePage } from '../../../@generic/component/searchable-page/searchable-page';
import { useCreateAction } from '../../../@generic/hook/use-create-action.hook';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { TagCard } from '../../../tag/components/tag-card/tag-card';
import { TagEmptyState } from '../../../tag/components/tag-empty-state/tag-empty-state';
import { useTagFormModal } from '../../../tag/context/tag-form-modal.context';
import { useTagsSelectorModal } from '../../../tag/context/tags-selector-modal.context';
import { useSearchTagsQuery } from '../../../tag/query/use-search-tags.query';
import { tagService } from '../../../tag/service/tag.service';

const handleGoBack = () => void goBackOrReplace('/settings');

export default function Tags() {
    const { t } = useLingui();
    const [openTagsSelector] = useTagsSelectorModal();
    const [openTagForm] = useTagFormModal();

    const [search, setSearch] = useState('');
    const { tags } = useSearchTagsQuery(search);

    useCreateAction({
        icon: UserIconNameEnum.Tag,
        label: t`Tag`,
        variant: 'primary',
        onPress: () => void openTagForm()
    });

    const handleDeleteTag = async (id: number) => {
        const count = await tagService.countTransactions(id);
        if (isPositiveNumber(count)) {
            const targetTagIds = await openTagsSelector({
                excludeTagIds: [id],
                description: t`This tag has transactions. Select another tag to reassign them to.`,
                singleSelect: true
            });

            const targetTagId = isNotEmptyArray(targetTagIds) ? targetTagIds[0] : null;
            if (isDefined(targetTagId)) {
                try {
                    await tagService.mergeInto(id, targetTagId);
                } catch {
                    Toast.show({
                        type: 'error',
                        text1: t`Could not reassign tag`,
                        text2: t`Please try again later`
                    });
                }
            }

            return;
        }
        await tagService.deleteById(id);
    };

    const handleOpenTag = (tag: TagEntityInterface) => {
        void openTagForm({ tag });
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
            searchInputTestID={TagPageSelectors.SearchInput}
        />
    );
}
/* jscpd:ignore-end */
