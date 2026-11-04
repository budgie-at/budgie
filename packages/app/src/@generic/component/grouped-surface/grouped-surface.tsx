import { View } from 'react-native';
import { ScopedVariables, useCSSVariable } from 'uniwind';

import { isDefined } from '@rnw-community/shared';

import { GroupedSurfacePaletteEnum } from '../../enum/grouped-surface-palette.enum';
import { cn } from '../../utils/cn.util';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly palette?: GroupedSurfacePaletteEnum;
    readonly testID?: string;
    readonly className?: string;
}

const PALETTE_SOURCES: Record<GroupedSurfacePaletteEnum, Record<string, string>> = {
    [GroupedSurfacePaletteEnum.PAGE]: {
        '--color-surface': '--color-grouped-surface',
        '--color-surface-row': '--color-grouped-surface-row',
        '--color-surface-fill': '--color-grouped-surface-fill'
    },
    [GroupedSurfacePaletteEnum.SHEET]: {
        '--color-surface': '--color-sheet-grouped-surface',
        '--color-surface-row': '--color-sheet-grouped-row',
        '--color-surface-disc': '--color-sheet-grouped-disc',
        '--color-surface-separator': '--color-sheet-grouped-separator',
        '--color-secondary-foreground': '--color-sheet-grouped-secondary'
    }
};

export const GroupedSurface = ({ children, palette = GroupedSurfacePaletteEnum.PAGE, testID, className }: Props) => {
    const values = useCSSVariable(Object.values(PALETTE_SOURCES[palette]));

    const variables = Object.fromEntries(
        Object.keys(PALETTE_SOURCES[palette]).flatMap((name, index) => {
            const value = values[index];

            return isDefined(value) ? [[name, value]] : [];
        })
    );

    return (
        <ScopedVariables variables={variables}>
            <View className={cn('flex-1 bg-surface', className)} testID={testID} collapsable={false}>
                {children}
            </View>
        </ScopedVariables>
    );
};
