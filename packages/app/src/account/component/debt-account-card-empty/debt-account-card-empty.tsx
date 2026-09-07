import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

export const DebtAccountCardEmpty = () => (
    <Text className="text-secondary-foreground text-xxs">
        <Trans>No debt yet</Trans>
    </Text>
);
