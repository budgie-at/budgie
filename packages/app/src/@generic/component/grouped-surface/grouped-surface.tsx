import { View } from 'react-native';
import { ScopedVariables, useCSSVariable } from 'uniwind';

import { isDefined } from '@rnw-community/shared';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
    readonly testID?: string;
}

export const GroupedSurface = ({ children, testID }: Props) => {
    const [surface, surfaceRow, surfaceFill] = useCSSVariable([
        '--color-grouped-surface',
        '--color-grouped-surface-row',
        '--color-grouped-surface-fill'
    ]);

    const variables = {
        ...(isDefined(surface) && { '--color-surface': surface }),
        ...(isDefined(surfaceRow) && { '--color-surface-row': surfaceRow }),
        ...(isDefined(surfaceFill) && { '--color-surface-fill': surfaceFill })
    };

    return (
        <ScopedVariables variables={variables}>
            <View className="flex-1 bg-surface" testID={testID} collapsable={false}>
                {children}
            </View>
        </ScopedVariables>
    );
};
