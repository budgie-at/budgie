import { RuleCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Controller, UseControllerReturn, useFormContext, useWatch } from 'react-hook-form';

import { useSearchTagsQuery } from '../../../tag/query/use-search-tags.query';
import { RuleActionBottomSheetSelector } from '../rule-action-bottom-sheet-selector/rule-action-bottom-sheet-selector';
import { RuleIconSlot } from '../rule-icon-slot/rule-icon-slot';

interface Props {
    readonly index: number;
}

export const RuleActionTagSelector = ({ index }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();

    const tagId = useWatch({ control, name: `actions.${index}.tagId` });
    const { tags } = useSearchTagsQuery('');

    const selectedTag = tags.find(tag => tag.id === tagId);
    const options = tags.map(tag => ({ value: tag.id, label: tag.title, iconSlot: <RuleIconSlot icon={UserIconNameEnum.Tag} /> }));

    const renderSelector = ({ field: { value, onChange } }: UseControllerReturn<RuleCreateInputInterface, `actions.${number}.tagId`>) => (
        <RuleActionBottomSheetSelector
            value={value}
            onChange={onChange}
            options={options}
            label={t`Tag`}
            sheetTitle={t`Select Tag`}
            displayValue={selectedTag?.title ?? t`Select Tag`}
        />
    );

    return <Controller control={control} name={`actions.${index}.tagId`} render={renderSelector} />;
};
