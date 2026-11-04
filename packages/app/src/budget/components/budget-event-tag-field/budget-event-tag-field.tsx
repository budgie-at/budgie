import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext } from 'react-hook-form';

import { isDefined, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { GroupedListValueRow } from '../../../@generic/component/grouped-list-value-row/grouped-list-value-row';
import { useTagsSelectorModal } from '../../../tag/context/tags-selector-modal.context';
import { BudgetSelector } from '../../budget.selector';
import { BudgetEventFormValues } from '../../constant/budget-event-form-schema.constant';
import { useBudgetEventTagPreview } from '../../hooks/use-budget-event-tag-preview.hook';

export const BudgetEventTagField = () => {
    const { t } = useLingui();
    const { setValue } = useFormContext<BudgetEventFormValues>();
    const [openTagsSelector] = useTagsSelectorModal();
    const { selectedTagIds, trimmedName, title, isNew } = useBudgetEventTagPreview();
    const fallbackTitle = isNotEmptyString(title) ? title : t`From the name`;
    const tagTitle = isNew ? t`New · ${title}` : fallbackTitle;

    const automaticLabel = isNotEmptyString(trimmedName) ? t`Use “${trimmedName}”` : t`Use the event name`;
    const isAutomaticTagPicked = isNotEmptyArray(selectedTagIds) && title.toLowerCase() === trimmedName.toLowerCase();

    const handleOpen = () => {
        openTagsSelector(
            { initialTagIds: selectedTagIds, singleSelect: true, ...(!isAutomaticTagPicked && { automaticLabel }) },
            selectedTagIdsResult => {
                if (!isDefined(selectedTagIdsResult)) {
                    return;
                }

                const nextTagId = isNotEmptyArray(selectedTagIdsResult) ? selectedTagIdsResult[0] : 0;

                setValue('tagId', nextTagId, { shouldDirty: true, shouldValidate: true });
            }
        );
    };

    return (
        <GroupedListValueRow
            icon={UserIconNameEnum.Tag}
            title={t`Tag`}
            value={tagTitle}
            testID={BudgetSelector.EventTagField}
            onPress={handleOpen}
        />
    );
};
