import { cva } from 'class-variance-authority';
import { Href, router } from 'expo-router';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';

import { Card } from '../../../@generic/components/card/card';
import { CircleIcon } from '../../../@generic/components/circle-icon/circle-icon';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { AccountCardContent } from '../account-card-content/account-card-content';

import type { IconName } from '../../../@generic/constant/icons.constant';

const LOGO_SIZE = 36;

const styles = StyleSheet.create({
    logo: { width: LOGO_SIZE, height: LOGO_SIZE, borderRadius: 10 }
});

interface Props {
    readonly title: string;
    readonly icon?: IconName;
    readonly image?: ImageSourcePropType;
    readonly description: string;
    readonly route: Href;
    readonly variant: ColorPaletteVariant;
}

const iconVariant = cva('', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
});

export const CreateBankSyncCard = ({ title, description, route, icon, image, variant }: Props) => {
    const handleNavigate = () => void router.push(route);

    const renderIcon = () => {
        if (image) {
            return (
                <View className="w-[52px] h-[52px] rounded-5xl bg-black items-center justify-center">
                    <Image source={image} style={styles.logo} />
                </View>
            );
        }

        if (icon) {
            return (
                <CircleIcon
                    border={false}
                    className="rounded-5xl w-[52px] h-[52px]"
                    icon={ICONS[icon]}
                    iconClassName={iconVariant({ variant })}
                    size="xl"
                    variant="ghost"
                />
            );
        }

        return null;
    };

    return (
        <Card className="p-5xl items-center flex-row gap-x-3xl active:scale-xs" onPress={handleNavigate}>
            {renderIcon()}

            <AccountCardContent title={title} description={description} />
        </Card>
    );
};
