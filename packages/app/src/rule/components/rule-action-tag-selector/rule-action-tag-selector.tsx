import { RuleCreateInputInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRef } from 'react';
import { Controller, UseControllerReturn, useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { Icon } from '../../../@generic/component/icon/icon';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useSearchTagsQuery } from '../../../tag/query/use-search-tags.query';
import { RuleSelectorField } from '../rule-selector-field/rule-selector-field';
import { RuleSelectorSheet } from '../rule-selector-sheet/rule-selector-sheet';

interface Props {
    index: number;
}

export const RuleActionTagSelector = ({ index }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const sheetRef = useRef<BottomSheetInterface | null>(null);

    const tagId = useWatch({ control, name: `actions.${index}.tagId` });
    const { tags } = useSearchTagsQuery('');
    const selectedTag = tags?.find(tag => tag.id === tagId);

    const options =
        tags?.map(tag => ({
            value: tag.id,
            label: tag.title,
            iconSlot: (
                <View className="w-10 h-10 bg-secondary-background rounded-full items-center justify-center">
                    <Icon icon={UserIconNameEnum.Tag} className="text-primary" size={18} />
                </View>
            )
        })) ?? [];

    const handleOpen = () => void sheetRef.current?.open();
    const handleClose = () => void sheetRef.current?.close();

    const renderSelector = ({ field: { value, onChange } }: UseControllerReturn<RuleCreateInputInterface, `actions.${number}.tagId`>) => {
        const handleSelect = (newValue: number) => {
            onChange(newValue);
            handleClose();
        };

        return (
            <>
                <RuleSelectorField label={<Trans>Tag</Trans>} value={selectedTag?.title ?? t`Select Tag`} onPress={handleOpen} />
                <RuleSelectorSheet ref={sheetRef} title={t`Select Tag`} options={options} selectedValue={value} onSelect={handleSelect} />
            </>
        );
    };

    return <Controller control={control} name={`actions.${index}.tagId`} render={renderSelector} />;
};
