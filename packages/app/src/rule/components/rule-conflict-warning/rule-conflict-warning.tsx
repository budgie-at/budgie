import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

interface Props {
    readonly hasConflict: boolean;
}

export const RuleConflictWarning = ({ hasConflict }: Props) => {
    if (!hasConflict) {
        return null;
    }

    return (
        <Text className="text-xs text-secondary-foreground">
            <Trans>Some transactions may match multiple rules. The first matching rule will take priority.</Trans>
        </Text>
    );
};
