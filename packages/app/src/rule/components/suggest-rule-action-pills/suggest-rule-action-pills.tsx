import { CategoryEntityInterface, TagEntityInterface } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { buildActionPillParts } from '../../util/build-action-pill-parts.util';
import { joinWithSeparators } from '../../util/join-with-separators.util';

interface Props {
    readonly category: Pick<CategoryEntityInterface, 'title'> | null;
    readonly tags: Pick<TagEntityInterface, 'title'>[] | null;
}

export const SuggestRuleActionPills = ({ category, tags }: Props) => {
    const hasTags = isNotEmptyArray(tags);

    if (!isDefined(category) && !hasTags) {
        return null;
    }

    const parts = buildActionPillParts(category, tags);
    const joined = joinWithSeparators(parts);

    return (
        <Text className="text-xs text-primary">
            <Trans>Set</Trans> {joined}
        </Text>
    );
};
