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
        <Text className="text-xs text-warning-foreground">
            <Trans>Some transactions may match multiple rules. The category from the first matching rule will be applied.</Trans>
        </Text>
    );
};
