import { View } from 'react-native';

import { cn } from '../../utils/cn.util';

import { SheetBottomFadeSelector } from './sheet-bottom-fade.selector';

interface Props {
    readonly className?: string;
}

export const SheetBottomFade = ({ className }: Props) => (
    <View
        pointerEvents="none"
        testID={SheetBottomFadeSelector.Root}
        className={cn('absolute bottom-0 left-0 right-0 z-20 h-[28px] bg-linear-to-t from-surface to-surface/0', className)}
    />
);
