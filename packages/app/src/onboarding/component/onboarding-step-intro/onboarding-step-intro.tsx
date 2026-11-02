import { UserIconNameEnum } from '@budgie/contracts';
import { Text, useWindowDimensions, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { cn } from '../../../@generic/utils/cn.util';

const COMPACT_HEIGHT = 700;

interface Props {
    readonly title: string;
    readonly description?: string;
    readonly icon?: UserIconNameEnum;
    readonly iconVariant?: ColorPaletteVariant;
}

export const OnboardingStepIntro = ({ title, description, icon, iconVariant }: Props) => {
    const { height } = useWindowDimensions();
    const iconMarginClassName = height <= COMPACT_HEIGHT ? 'mb-[16px]' : 'mb-3xl';
    const accentIcon =
        isDefined(icon) && isDefined(iconVariant) ? (
            <CircleIcon icon={icon} variant={iconVariant} size={56} iconSize={28} className={cn('rounded-3xl', iconMarginClassName)} />
        ) : null;
    const neutralIcon =
        isDefined(icon) && !isDefined(iconVariant) ? (
            <CircleIcon
                icon={icon}
                variant="secondary"
                size={48}
                iconSize={24}
                radius={24}
                border={false}
                className={cn('bg-surface-disc', iconMarginClassName)}
                iconClassName="text-primary"
            />
        ) : null;

    return (
        <View>
            {accentIcon}
            {neutralIcon}

            <Text className="text-primary text-(length:--text-4xl) font-semibold tracking-tight text-left">{title}</Text>

            {isNotEmptyString(description) ? (
                <Text className="text-secondary-foreground text-[15px] leading-[21px] mt-md text-left">{description}</Text>
            ) : null}
        </View>
    );
};
