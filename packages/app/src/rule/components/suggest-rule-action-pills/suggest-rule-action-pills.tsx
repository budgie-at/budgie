import { CategoryEntityInterface, TagEntityInterface } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { Fragment, type ReactNode } from 'react';
import { Text } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

interface Props {
    readonly category: Pick<CategoryEntityInterface, 'title'> | null;
    readonly tags: Pick<TagEntityInterface, 'title'>[] | null;
}

export const SuggestRuleActionPills = ({ category, tags }: Props) => {
    const hasTags = isNotEmptyArray(tags);

    if (!isDefined(category) && !hasTags) {
        return null;
    }

    const parts: ReactNode[] = [];

    if (isDefined(category)) {
        const categoryTitle = category.title;
        parts.push(
            <Fragment key="category">
                <Trans>
                    category to <Text className="font-semibold">{categoryTitle}</Text>
                </Trans>
            </Fragment>
        );
    }

    if (hasTags) {
        for (const tag of tags) {
            const tagTitle = tag.title;
            parts.push(
                <Fragment key={`tag-${tagTitle}`}>
                    <Trans>
                        tag <Text className="font-semibold">{tagTitle}</Text>
                    </Trans>
                </Fragment>
            );
        }
    }

    const joined: ReactNode[] = [];
    const andSeparator = ` ${t`and`} `;

    for (const [index, part] of parts.entries()) {
        if (index > 0) {
            const separator = index < parts.length - 1 ? ', ' : andSeparator;
            joined.push(<Fragment key={`sep-${index}`}>{separator}</Fragment>);
        }
        joined.push(part);
    }

    return (
        <Text className="text-xs text-primary">
            <Trans>Set</Trans> {joined}
        </Text>
    );
};
