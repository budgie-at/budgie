import { RuleConditionEntityInterface } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Fragment } from 'react';
import { Text } from 'react-native';

import { RuleConditionPill } from '../rule-condition-pill/rule-condition-pill';

interface Props {
    readonly condition: Pick<RuleConditionEntityInterface, 'field' | 'operator' | 'value' | 'id'>;
    readonly isLast: boolean;
    readonly isMatchAll: boolean;
}

export const RuleSummaryConditionItem = ({ condition, isLast, isMatchAll }: Props) => {
    const separator = isMatchAll ? <Trans>and</Trans> : <Trans>or</Trans>;

    return (
        <Fragment>
            <RuleConditionPill condition={condition} />
            {isLast ? null : <Text className="text-xs text-secondary-foreground">{separator}</Text>}
        </Fragment>
    );
};
