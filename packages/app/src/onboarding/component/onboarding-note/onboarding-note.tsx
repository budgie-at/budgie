import { UserIconNameEnum } from '@budgie/contracts';
import { Text } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { Icon } from '../../../@generic/component/icon/icon';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { cn } from '../../../@generic/utils/cn.util';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly text: string;
    readonly variant?: ColorPaletteVariant;
    readonly testID?: string;
}

export const OnboardingNote = ({ icon, text, variant = 'secondary', testID }: Props) => (
    <Card variant={variant} size="md" className="flex-row items-start gap-x-md" testID={testID}>
        <Icon icon={icon} size={16} className={cn(FOREGROUND_COLOR_PALETTE[variant], 'mt-xxs')} />
        <Text className="text-primary text-sm flex-1">{text}</Text>
    </Card>
);
