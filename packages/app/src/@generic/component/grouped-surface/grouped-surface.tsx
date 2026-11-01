import { View } from 'react-native';
import { ScopedVariables, useCSSVariable } from 'uniwind';

import { isDefined } from '@rnw-community/shared';

import { GroupedSurfacePaletteEnum } from '../../enum/grouped-surface-palette.enum';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly palette?: GroupedSurfacePaletteEnum;
    readonly testID?: string;
}

const SCOPED_VARIABLES = [
    '--color-surface',
    '--color-surface-row',
    '--color-surface-fill',
    '--color-surface-disc',
    '--color-surface-separator',
    '--color-secondary-foreground'
] as const;

const PALETTE_SOURCES: Record<GroupedSurfacePaletteEnum, readonly string[]> = {
    [GroupedSurfacePaletteEnum.PAGE]: [
        '--color-grouped-surface',
        '--color-grouped-surface-row',
        '--color-grouped-surface-fill',
        '--color-surface-disc',
        '--color-surface-separator',
        '--color-secondary-foreground'
    ],
    [GroupedSurfacePaletteEnum.SHEET]: [
        '--color-sheet-grouped-surface',
        '--color-sheet-grouped-row',
        '--color-surface-fill',
        '--color-sheet-grouped-disc',
        '--color-sheet-grouped-separator',
        '--color-sheet-grouped-secondary'
    ]
};

export const GroupedSurface = ({ children, palette = GroupedSurfacePaletteEnum.PAGE, testID }: Props) => {
    const values = useCSSVariable([...PALETTE_SOURCES[palette]]);

    const variables = Object.fromEntries(
        SCOPED_VARIABLES.flatMap((name, index) => {
            const value = values[index];

            return isDefined(value) ? [[name, value]] : [];
        })
    );

    return (
        <ScopedVariables variables={variables}>
            <View className="flex-1 bg-surface" testID={testID} collapsable={false}>
                {children}
            </View>
        </ScopedVariables>
    );
};
