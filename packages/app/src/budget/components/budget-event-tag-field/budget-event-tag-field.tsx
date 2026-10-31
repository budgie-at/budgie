import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';

import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { RuleSelectorButton } from '../../../rule/components/rule-selector-button/rule-selector-button';
import { useTagsSelectorModal } from '../../../tag/context/tags-selector-modal.context';
import { useGetTagByIdsQuery } from '../../../tag/query/use-get-tag-by-ids.query';
import { BudgetSelector } from '../../budget.selector';
import { BudgetEventFormValues } from '../../constant/budget-event-form-schema.constant';

export const BudgetEventTagField = () => {
    const { t } = useLingui();
    const { control, setValue } = useFormContext<BudgetEventFormValues>();
    const [openTagsSelector] = useTagsSelectorModal();
    const tagId = useWatch({ control, name: 'tagId' });
    const selectedTagIds = isPositiveNumber(tagId) ? [tagId] : [];
    const { tags } = useGetTagByIdsQuery(selectedTagIds);
    const tagTitle = isNotEmptyArray(tags) ? tags[0].title : t`Select tag`;

    const handleOpen = () => {
        openTagsSelector({ initialTagIds: selectedTagIds, singleSelect: true }, selectedTagIdsResult => {
            if (isNotEmptyArray(selectedTagIdsResult)) {
                setValue('tagId', selectedTagIdsResult[0], { shouldDirty: true, shouldValidate: true });
            }
        });
    };

    return (
        <FormItem label={t`Tag`}>
            <RuleSelectorButton testID={BudgetSelector.EventTagField} value={tagTitle} onPress={handleOpen} />
        </FormItem>
    );
};
