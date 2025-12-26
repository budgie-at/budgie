import { BankProviderEnum } from '@budgie/bank-sync';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { BankLogo } from '../../../@generic/components/bank-logo/bank-logo';
import { Card } from '../../../@generic/components/card/card';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';

interface Props {
    readonly onPress: () => void;
}

export const GetTokenCard = ({ onPress }: Props) => (
    <Card className="p-5xl" onPress={onPress}>
        <View className="flex-row items-center gap-x-3xl">
            <BankLogo bankProvider={BankProviderEnum.MONOBANK} />
            <View className="flex-1">
                <Text className="text-primary text-foreground text-md font-medium mb-xs">
                    <Trans>Get API Token</Trans>
                </Text>
                <Text className="text-primary text-muted-foreground text-sm">
                    <Trans>Open Monobank to get your token</Trans>
                </Text>
            </View>
            <Icon icon={ICONS.ChevronRight} className="text-muted-foreground" />
        </View>
    </Card>
);
