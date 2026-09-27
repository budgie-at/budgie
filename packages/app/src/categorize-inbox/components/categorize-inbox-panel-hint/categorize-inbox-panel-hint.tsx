import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

export const CategorizeInboxPanelHint = () => (
    <Text className="text-center text-sm font-medium text-secondary-foreground" numberOfLines={1}>
        <Trans>Tap a suggestion or swipe right</Trans>
    </Text>
);
