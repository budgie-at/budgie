import { CategoryEntityInterface, TagEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { getSuggestRuleActionItems } from '../../util/get-suggest-rule-action-items.util';

interface Props {
    readonly category: Pick<CategoryEntityInterface, 'title'> | null;
    readonly tags: Pick<TagEntityInterface, 'title'>[] | null;
}

export const SuggestRuleDescriptionActions = ({ category, tags }: Props) => {
    const { t } = useLingui();
    const actionItems = getSuggestRuleActionItems({ category, tags });

    return (
        <View className="gap-y-xxs">
            {actionItems.map((item, index) => (
                <Text key={index} className="text-sm text-primary">
                    {t(item.label)} &quot;{item.value}&quot;
                </Text>
            ))}
        </View>
    );
};
