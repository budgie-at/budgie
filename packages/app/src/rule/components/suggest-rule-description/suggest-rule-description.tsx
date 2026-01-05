import { RuleConditionFieldEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useGetCategoryByIdQuery } from '../../../category/query/use-get-category-by-id.query';
import { useGetTagByIdsQuery } from '../../../tag/query/use-get-tag-by-ids.query';
import { SuggestRuleDataInterface } from '../../interface/suggest-rule-data.interface';

import { SuggestRuleDescriptionContent } from './suggest-rule-description-content';

interface Props {
    readonly data: SuggestRuleDataInterface;
    readonly selectedFields: RuleConditionFieldEnum[];
}

export const SuggestRuleDescription = ({ data, selectedFields }: Props) => {
    const { category } = useGetCategoryByIdQuery(data.categoryId ?? 0);
    const { tags } = useGetTagByIdsQuery(data.tagIds);

    const hasSelectedFields = selectedFields.length > 0;
    const hasCategory = isDefined(data.categoryId) && isDefined(category);
    const hasTags = isNotEmptyArray(data.tagIds) && isNotEmptyArray(tags);
    const hasActions = hasCategory || hasTags;

    if (!hasActions) {
        return null;
    }

    return (
        <View className="bg-secondary-background/50 rounded-2xl p-lg mt-lg min-h-19">
            {hasSelectedFields ? (
                <SuggestRuleDescriptionContent data={data} selectedFields={selectedFields} category={category} tags={tags} />
            ) : (
                <Text className="text-sm text-secondary-foreground">
                    <Trans>Select at least one condition</Trans>
                </Text>
            )}
        </View>
    );
};
