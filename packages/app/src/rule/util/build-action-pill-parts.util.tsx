import { CategoryEntityInterface, TagEntityInterface } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Fragment, type ReactNode } from 'react';
import { Text } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

export const buildActionPillParts = (
    category: Pick<CategoryEntityInterface, 'title'> | null,
    tags: Pick<TagEntityInterface, 'title'>[] | null
): ReactNode[] => {
    const parts: ReactNode[] = [];

    if (isDefined(category)) {
        const categoryTitle = category.title;
        parts.push(
            <Fragment key="category">
                <Trans>
                    category to <Text className="font-semibold text-foreground">{categoryTitle}</Text>
                </Trans>
            </Fragment>
        );
    }

    if (isNotEmptyArray(tags)) {
        for (const tag of tags) {
            const tagTitle = tag.title;
            parts.push(
                <Fragment key={`tag-${tagTitle}`}>
                    <Trans>
                        tag <Text className="font-semibold text-foreground">{tagTitle}</Text>
                    </Trans>
                </Fragment>
            );
        }
    }

    return parts;
};
