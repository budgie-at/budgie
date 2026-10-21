import { UserIconNameEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props {
    readonly title: string;
    readonly description?: string;
    readonly icon?: UserIconNameEnum;
    readonly iconVariant?: ColorPaletteVariant;
}

export const OnboardingStepIntro = ({ title, description, icon, iconVariant = 'secondary' }: Props) => (
    <View>
        {isDefined(icon) ? <CircleIcon icon={icon} variant={iconVariant} size={56} iconSize={28} className="rounded-3xl mb-3xl" /> : null}

        <Text className="text-primary text-(length:--text-4xl) font-semibold tracking-tight text-left">{title}</Text>

        {isNotEmptyString(description) ? <Text className="text-secondary-foreground text-md mt-lg text-left">{description}</Text> : null}
    </View>
);
