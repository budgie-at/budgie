import { cva } from 'class-variance-authority';
import { Href, router } from 'expo-router';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/components/card/card';
import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { Icon } from '../../../@generic/components/icon/icon';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

import type { IconName } from '../../../@generic/constant/icons.constant';

interface Props {
    readonly title: string;
    readonly icon: IconName;
    readonly description: string;
    readonly route: Href;
    readonly variant: ColorPaletteVariant;
}

const iconVariant = cva('', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
});

export const CreateBankSyncCard = ({ title, description, route, icon, variant }: Props) => {
    const handleNavigate = () => void router.push(route);

    return (
        <Card className="p-5xl items-center flex-row gap-x-3xl active:scale-xs" onPress={handleNavigate}>
            <CircleIcon
                border={false}
                className="rounded-5xl w-[52px] h-[52px]"
                icon={ICONS[icon]}
                iconClassName={iconVariant({ variant })}
                size="xl"
                variant="ghost"
            />

            <View className="flex-1">
                <Text className="text-primary text-md font-medium mb-xs">{title}</Text>
                <Text className="text-secondary-foreground text-sm">{description}</Text>
            </View>

            <Icon className="text-primary/40" icon={ICONS.ChevronRight} />
        </Card>
    );
};
