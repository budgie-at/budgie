import { RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext, useWatch } from 'react-hook-form';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { FormSelectorField } from '../../../@generic/component/form-selector-field/form-selector-field';
import { useTagsSelectorModal } from '../../../tag/context/tags-selector-modal.context';
import { useGetTagByIdsQuery } from '../../../tag/query/use-get-tag-by-ids.query';

interface Props {
    readonly index: number;
    readonly testID?: string;
}

export const RuleActionTagSelector = ({ index, testID }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const [openTagsSelector] = useTagsSelectorModal();

    const tagId = useWatch({ control, name: `actions.${index}.tagId` });
    const { tags } = useGetTagByIdsQuery(isDefined(tagId) ? [tagId] : []);

    const renderSelector = ({ field: { onChange } }: UseControllerReturn<RuleCreateInputInterface, `actions.${number}.tagId`>) => {
        const handleOpen = async () => {
            const selectedTagIds = await openTagsSelector({ initialTagIds: isDefined(tagId) ? [tagId] : [], singleSelect: true });

            if (isNotEmptyArray(selectedTagIds)) {
                onChange(selectedTagIds[0]);
            }
        };

        return <FormSelectorField label={t`Tag`} value={tags?.[0]?.title ?? t`Select Tag`} onPress={handleOpen} testID={testID} />;
    };

    return <Controller control={control} name={`actions.${index}.tagId`} render={renderSelector} />;
};
