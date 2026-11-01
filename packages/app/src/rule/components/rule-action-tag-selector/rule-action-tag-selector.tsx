import { RuleCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useController, useFormContext } from 'react-hook-form';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useTagsSelectorModal } from '../../../tag/context/tags-selector-modal.context';
import { useGetTagByIdsQuery } from '../../../tag/query/use-get-tag-by-ids.query';
import { RuleValueGlyph } from '../rule-value-glyph/rule-value-glyph';
import { RuleValuePickerButton } from '../rule-value-picker-button/rule-value-picker-button';

interface Props {
    readonly index: number;
    readonly testID?: string;
}

export const RuleActionTagSelector = ({ index, testID }: Props) => {
    const { t } = useLingui();
    const { control, formState } = useFormContext<RuleCreateInputInterface>();
    const {
        field: { value: tagId, onChange }
    } = useController({ control, name: `actions.${index}.tagId` });
    const [openTagsSelector] = useTagsSelectorModal();
    const selectedTagIds = isDefined(tagId) ? [tagId] : [];
    const { tags } = useGetTagByIdsQuery(selectedTagIds);
    const tagTitle = tags?.at(0)?.title;
    const tagLabel = isDefined(tagTitle) ? `#${tagTitle}` : null;

    const isMissing = !isDefined(tagId) && (formState.isDirty || formState.submitCount > 0);

    const handleOpen = () => {
        openTagsSelector({ initialTagIds: selectedTagIds, singleSelect: true }, nextTagIds => {
            if (isNotEmptyArray(nextTagIds)) {
                onChange(nextTagIds[0]);
            }
        });
    };

    return (
        <RuleValuePickerButton
            value={tagLabel}
            isMissing={isMissing}
            leading={<RuleValueGlyph icon={UserIconNameEnum.Tag} variant="pink" />}
            placeholder={t`Choose a tag`}
            name={t`Tag`}
            onPress={handleOpen}
            testID={testID}
        />
    );
};
