import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { SyncRepairsPageSelector } from '../../../app/(tabs)/settings/sync-repairs-page.selector';

export const SyncRepairsEmptyStateCard = () => (
    <Card testID={SyncRepairsPageSelector.EmptyState} className="items-center gap-y-2xl" variant="positive">
        <CircleIcon icon={UserIconNameEnum.CircleCheck} variant="positive" border={false} size={44} iconSize={22} />
        <Text className="text-positive-foreground text-sm font-medium text-center">
            <Trans>No sync repairs found.</Trans>
        </Text>
    </Card>
);
