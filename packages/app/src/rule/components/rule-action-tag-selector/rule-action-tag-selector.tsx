import { RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useController, useFormContext } from 'react-hook-form';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useTagsSelectorModal } from '../../../tag/context/tags-selector-modal.context';
import { useGetTagByIdsQuery } from '../../../tag/query/use-get-tag-by-ids.query';
import { RuleValuePickerButton } from '../rule-value-picker-button/rule-value-picker-button';

interface Props {
    readonly index: number;
    readonly testID?: string;
}

export const RuleActionTagSelector = ({ index, testID }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const {
        field: { value: tagId, onChange }
    } = useController({ control, name: `actions.${index}.tagId` });
    const [openTagsSelector] = useTagsSelectorModal();
    const selectedTagIds = isDefined(tagId) ? [tagId] : [];
    const { tags } = useGetTagByIdsQuery(selectedTagIds);

    const handleOpen = () => {
        openTagsSelector({ initialTagIds: selectedTagIds, singleSelect: true }, nextTagIds => {
            if (isNotEmptyArray(nextTagIds)) {
                onChange(nextTagIds[0]);
            }
        });
    };

    return (
        <RuleValuePickerButton
            value={tags?.at(0)?.title ?? null}
            placeholder={t`Choose a tag`}
            name={t`Tag`}
            onPress={handleOpen}
            testID={testID}
        />
    );
};
