import { Text, View } from 'react-native';

import { Card } from '../../../@generic/components/card/card';
import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { ICONS, IconName } from '../../../@generic/constant/icons.constant';
import { CircleIconVariant } from '../../../@generic/type/circle-icon-variant.type';

interface Props {
    title: string;
    icon: IconName;
    description: string;
    variant: CircleIconVariant;
}

export const SettingsTextItem = ({ icon, variant, title, description }: Props) => (
    <Card className={'flex-row gap-x-[12px] bg-secondary-background flex-1'}>
        <CircleIcon size={'xl'} icon={ICONS[icon]} variant={variant} />

        <View className={'gap-y-[5px] flex-1'}>
            <Text className={'text-primary text-[16px]'}>{title}</Text>
            <Text className={'text-secondary-foreground text-[14px]'}>{description}</Text>
        </View>
    </Card>
);
