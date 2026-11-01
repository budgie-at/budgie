import { RuleCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useController, useFormContext } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { useCategorySelectorModal } from '../../../category/context/category-selector-modal.context';
import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { RuleValueGlyph } from '../rule-value-glyph/rule-value-glyph';
import { RuleValuePickerButton } from '../rule-value-picker-button/rule-value-picker-button';

interface Props {
    readonly index: number;
    readonly testID?: string;
}

export const RuleActionCategorySelector = ({ index, testID }: Props) => {
    const { t } = useLingui();
    const { control, formState } = useFormContext<RuleCreateInputInterface>();
    const {
        field: { value: categoryId, onChange }
    } = useController({ control, name: `actions.${index}.categoryId` });
    const [openCategorySelector] = useCategorySelectorModal();
    const { category } = useGetCategoryByIdQuery(categoryId ?? 0);

    const isMissing = !isDefined(categoryId) && (formState.isDirty || formState.submitCount > 0);

    const handleOpen = () => {
        openCategorySelector({ initialCategoryId: categoryId, variant: 'violet', title: t`Choose a category` }, selectedCategoryId => {
            if (isDefined(selectedCategoryId)) {
                onChange(selectedCategoryId);
            }
        });
    };

    return (
        <RuleValuePickerButton
            value={category?.title ?? null}
            isMissing={isMissing}
            leading={<RuleValueGlyph icon={category?.icon ?? UserIconNameEnum.FolderOpen} variant="violet" />}
            placeholder={t`Choose a category`}
            name={t`Category`}
            onPress={handleOpen}
            testID={testID}
        />
    );
};
