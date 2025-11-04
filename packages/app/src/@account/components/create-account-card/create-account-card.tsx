import { Text, View } from 'react-native';

import { Card } from '../../../@generic/components/card/card';
import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';

import type { IconName } from '../../../@generic/constant/icons.constant';
import type { CircleIconVariant } from '../../../@generic/type/circle-icon-variant.type';

interface Props {
    readonly title: string;
    readonly icon: IconName;
    readonly description: string;
    readonly variant: CircleIconVariant;
}

export const CreateAccountCard = ({ title, description, variant, icon }: Props) => (
    <Card className="p-5xl items-center gap-x-4 flex-row gap-1" key={title}>
        <CircleIcon border={false} className="rounded-5xl w-12 h-12" icon={ICONS[icon]} size="xl" variant={variant} />

        <View className="mr-auto">
            <Text className="text-primary text-[16px] font-medium">{title}</Text>
            <Text className="text-secondary-foreground text-[14px]">{description}</Text>
        </View>

        <Icon className="text-primary/40" icon={ICONS.ChevronRight} />
    </Card>
);
