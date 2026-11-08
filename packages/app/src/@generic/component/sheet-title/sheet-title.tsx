import { Text } from 'react-native';

import { cn } from '../../utils/cn.util';
import { MorphingSheetDragZone } from '../morphing-sheet-drag-zone/morphing-sheet-drag-zone';

interface Props {
    readonly title: string;
    readonly className?: string;
    readonly maxFontSizeMultiplier?: number;
}

export const SheetTitle = ({ title, className, maxFontSizeMultiplier }: Props) => (
    <MorphingSheetDragZone>
        <Text
            accessibilityRole="header"
            maxFontSizeMultiplier={maxFontSizeMultiplier}
            className={cn('text-primary px-xl pt-xl pb-lg text-center text-[17px] leading-[22px] font-semibold', className)}
        >
            {title}
        </Text>
    </MorphingSheetDragZone>
);
