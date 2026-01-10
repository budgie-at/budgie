import { CategoryEntityInterface, TagEntityInterface } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Fragment } from 'react';
import { Text } from 'react-native';

import { SuggestRuleDataInterface } from '../../interface/suggest-rule-data.interface';
import { getSuggestRuleActionItems } from '../../util/get-suggest-rule-action-items.util';

interface Props {
    readonly data: SuggestRuleDataInterface;
    readonly category: CategoryEntityInterface | null;
    readonly tags: TagEntityInterface[] | null;
}

export const SuggestRuleDescriptionActions = ({ data, category, tags }: Props) => {
    const actions = getSuggestRuleActionItems({ data, category, tags });

    return (
        <>
            {actions.map((action, index) => (
                <Fragment key={action.key}>
                    <Text className="text-sm text-secondary-foreground">{action.content}</Text>

                    {index < actions.length - 1 ? (
                        <Text className="text-sm text-secondary-foreground">
                            <Trans> and </Trans>
                        </Text>
                    ) : null}
                </Fragment>
            ))}
        </>
    );
};
