import { View } from 'react-native';

import { cn } from '../../utils/cn.util';

interface Props {
    readonly className?: string;
}

export const SheetBottomFade = ({ className }: Props) => (
    <View
        pointerEvents="none"
        className={cn('absolute bottom-0 left-0 right-0 z-20 h-[28px] bg-linear-to-t from-surface to-surface/0', className)}
    />
);
