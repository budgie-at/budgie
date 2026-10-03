import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

export const DebtAccountCardEmpty = () => (
    <Text className="shrink-0 text-xs text-secondary-foreground" numberOfLines={1}>
        <Trans>No debt yet</Trans>
    </Text>
);
