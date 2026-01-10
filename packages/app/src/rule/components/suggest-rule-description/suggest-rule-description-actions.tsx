import { CategoryEntityInterface, TagEntityInterface } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { ReactNode } from 'react';
import { Text } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { SuggestRuleDataInterface } from '../../interface/suggest-rule-data.interface';

interface Props {
    readonly data: SuggestRuleDataInterface;
    readonly category: CategoryEntityInterface | null;
    readonly tags: TagEntityInterface[] | null;
}

export const SuggestRuleDescriptionActions = ({ data, category, tags }: Props) => {
    const hasCategory = isDefined(data.categoryId) && isDefined(category);
    const hasTags = isNotEmptyArray(data.tagIds) && isNotEmptyArray(tags);

    const actions: ReactNode[] = [];

    if (hasCategory) {
        const categoryTitle = category.title;

        actions.push(
            <Text key="category" className="text-sm text-secondary-foreground">
                <Trans>
                    assign category <Text className="font-semibold text-primary">&quot;{categoryTitle}&quot;</Text>
                </Trans>
            </Text>
        );
    }

    if (hasTags) {
        tags.forEach(tag => {
            const tagTitle = tag.title;

            actions.push(
                <Text key={`tag-${tag.id}`} className="text-sm text-secondary-foreground">
                    <Trans>
                        add tag <Text className="font-semibold text-primary">&quot;{tagTitle}&quot;</Text>
                    </Trans>
                </Text>
            );
        });
    }

    return (
        <>
            {actions.map((action, index) => (
                <Text key={index} className="text-sm text-secondary-foreground">
                    {action}
                    {index < actions.length - 1 ? <Trans> and </Trans> : ''}
                </Text>
            ))}
        </>
    );
};
