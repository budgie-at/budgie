import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';

export const BankSyncRepairsIntroCard = () => (
    <Card className="gap-y-3xl" variant="primary">
        <CircleIcon icon={UserIconNameEnum.Wrench} variant="dark-warning" border={false} size={48} iconSize={24} />

        <View className="gap-y-sm">
            <Text className="text-primary text-base font-semibold">
                <Trans>Bank sync data repairs</Trans>
            </Text>
            <Text className="text-secondary-foreground text-sm">
                <Trans>
                    Budgie can find duplicated bank sync imports and repair transfer consolidations that landed on inactive accounts.
                </Trans>
            </Text>
        </View>
    </Card>
);
