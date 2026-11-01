import { TransactionCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { useTagsSelectorModal } from '../../../tag/context/tags-selector-modal.context';
import { useGetTagByIdsQuery } from '../../../tag/query/use-get-tag-by-ids.query';
import { getTagsDisplayValue } from '../../utils/get-tags-display-value.util';
import { SimpleQuickFormSelector } from '../simple-quick-form/simple-quick-form.selector';
import { TransactionFieldIcon } from '../transaction-field-icon/transaction-field-icon';

export const TransactionTagsFieldIcon = () => {
    const { t } = useLingui();
    const { control, setValue } = useFormContext<TransactionCreateInputInterface>();
    const [openTagsSelector] = useTagsSelectorModal();
    const tagIds = useWatch({ control, name: 'tagIds' });
    const { tags } = useGetTagByIdsQuery(tagIds);

    const handlePress = () => {
        openTagsSelector({ initialTagIds: tagIds, enablePrimarySelection: true }, selectedTagIds => {
            if (isDefined(selectedTagIds)) {
                setValue('tagIds', selectedTagIds);
            }
        });
    };

    const tagsValue = getTagsDisplayValue(tags);

    return (
        <TransactionFieldIcon
            icon={UserIconNameEnum.Tag}
            label={t`Tags`}
            value={tagsValue}
            onPress={handlePress}
            animationDelay={80}
            testID={SimpleQuickFormSelector.TagsSelector}
        />
    );
};
