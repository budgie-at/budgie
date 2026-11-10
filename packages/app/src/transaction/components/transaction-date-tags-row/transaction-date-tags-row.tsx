import { TransactionCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';

import { isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { useOpenModal } from '../../../@generic/hook/use-open-modal/use-open-modal.hook';
import { useGetTagByIdsQuery } from '../../../tag/query/use-get-tag-by-ids.query';
import { useTransactionDateLabel } from '../../hook/use-transaction-date-label.hook';
import { SimpleQuickFormSelector } from '../simple-quick-form/simple-quick-form.selector';
import { TransactionFieldIcon } from '../transaction-field-icon/transaction-field-icon';

interface Props {
    readonly onDatePress: () => void;
}

const VISIBLE_TAG_COUNT = 2;
const NO_BREAK_SPACE = '\u00A0';

export const TransactionDateTagsRow = ({ onDatePress }: Props) => {
    const { t } = useLingui();
    const { control, setValue } = useFormContext<TransactionCreateInputInterface>();
    const openTagsSelector = useOpenModal('/tags-selector');
    const tagIds = useWatch({ control, name: 'tagIds' });
    const { tags } = useGetTagByIdsQuery(tagIds);
    const dateLabel = useTransactionDateLabel();
    const tagTitles = (tags ?? []).map(tag => tag.title.replaceAll(' ', NO_BREAK_SPACE));
    const hiddenTagCount = tagTitles.length - VISIBLE_TAG_COUNT;
    const visibleTags = tagTitles.slice(0, VISIBLE_TAG_COUNT).join(', ');
    const tagsValue = isPositiveNumber(hiddenTagCount) ? `${visibleTags}${NO_BREAK_SPACE}+${hiddenTagCount}` : visibleTags;
    const tagsDisplayValue = isNotEmptyArray(tagTitles) ? tagsValue : void 0;

    const handleTagsPress = () => {
        openTagsSelector({ initialTagIds: tagIds, enablePrimarySelection: true }, selectedTagIds => {
            if (isDefined(selectedTagIds)) {
                setValue('tagIds', selectedTagIds, { shouldDirty: true });
            }
        });
    };

    return (
        <>
            <TransactionFieldIcon
                icon={UserIconNameEnum.Calendar}
                label={t`Date`}
                value={dateLabel}
                onPress={onDatePress}
                testID={SimpleQuickFormSelector.DatePicker}
            />
            <TransactionFieldIcon
                icon={UserIconNameEnum.Tag}
                label={t`Tags`}
                value={tagsDisplayValue}
                placeholder={t`Add`}
                onPress={handleTagsPress}
                testID={SimpleQuickFormSelector.TagsSelector}
            />
        </>
    );
};
