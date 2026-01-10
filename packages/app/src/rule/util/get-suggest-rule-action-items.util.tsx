import { CategoryEntityInterface, TagEntityInterface } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { ReactNode } from 'react';
import { Text } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';

interface SuggestRuleActionItemInterface {
    readonly key: string;
    readonly content: ReactNode;
}

interface ParamsInterface {
    readonly data: SuggestRuleDataInterface;
    readonly category: CategoryEntityInterface | null;
    readonly tags: TagEntityInterface[] | null;
}

const getCategoryAction = ({ title }: CategoryEntityInterface): SuggestRuleActionItemInterface => ({
    key: 'category',
    content: (
        <Trans>
            assign category <Text className="font-semibold text-primary">&quot;{title}&quot;</Text>
        </Trans>
    )
});

const getTagAction = ({ title, id }: TagEntityInterface): SuggestRuleActionItemInterface => ({
    key: `tag-${id}`,
    content: (
        <Trans>
            add tag <Text className="font-semibold text-primary">&quot;{title}&quot;</Text>
        </Trans>
    )
});

export const getSuggestRuleActionItems = ({ data, category, tags }: ParamsInterface): SuggestRuleActionItemInterface[] => {
    const hasCategory = isDefined(data.categoryId) && isDefined(category);
    const hasTags = isNotEmptyArray(data.tagIds) && isNotEmptyArray(tags);

    const categoryActions = hasCategory ? [getCategoryAction(category)] : [];
    const tagActions = hasTags ? tags.map(getTagAction) : [];

    return [...categoryActions, ...tagActions];
};
