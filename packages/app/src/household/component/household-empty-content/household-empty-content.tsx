import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { HouseholdInviteRow } from '../household-invite-row/household-invite-row';

export const HouseholdEmptyContent = () => (
    <View className="gap-y-lg">
        <Text className="text-secondary-foreground px-3xl text-[13px] leading-[18px]">
            <Trans>
                Share accounts with the people you live with. Everyone you invite can see and edit everything in the shared household,
                and each person keeps their own private accounts to themselves.
            </Trans>
        </Text>
        <HouseholdInviteRow />
    </View>
);
