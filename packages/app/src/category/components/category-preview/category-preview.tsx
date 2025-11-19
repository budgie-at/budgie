import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/components/card/card';
import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { ICONS } from '../../../@generic/constant/icons.constant';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly title: string;
}

export const CategoryPreview = ({ icon, title }: Props) => (
    <Card className="gap-y-lg">
        <Text className="uppercase text-secondary-foreground text-xs">
            <Trans>Preview</Trans>
        </Text>

        <View className="flex-row items-center gap-x-xl">
            <CircleIcon size="1_5xl" icon={ICONS[icon]} variant="default" />

            <Text className="text-primary flex-1">{title}</Text>
        </View>
    </Card>
);
