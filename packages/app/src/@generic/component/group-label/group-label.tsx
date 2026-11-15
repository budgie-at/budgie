import { Text } from 'react-native';

import { TITLE_MAX_FONT_SIZE_MULTIPLIER } from '../../constant/title-max-font-size-multiplier.constant';
import { cn } from '../../utils/cn.util';

interface Props {
    readonly title: string;
    readonly className?: string;
}

export const GroupLabel = ({ title, className }: Props) => (
    <Text
        className={cn('text-xs uppercase text-secondary-foreground', className)}
        accessibilityRole="header"
        maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER}
    >
        {title}
    </Text>
);
