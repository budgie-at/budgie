import { ScrollView, View } from 'react-native';

import { useMorphingSheetListHeight } from '../../hook/use-morphing-sheet-list-height.hook';
import { SheetSurface } from '../sheet-surface/sheet-surface';

import type { ReactNode } from 'react';

interface Props {
    readonly header: ReactNode;
    readonly ratio: number;
    readonly contentClassName?: string;
    readonly footer?: ReactNode;
    readonly testID?: string;
    readonly children: ReactNode;
}

export const ScrollableSheetCard = ({ header, ratio, contentClassName, footer, testID, children }: Props) => {
    const { height } = useMorphingSheetListHeight(ratio);
    const capStyle = { maxHeight: height };

    return (
        <View style={capStyle} testID={testID}>
            <SheetSurface className="flex-initial pt-lg" contentClassName="flex-initial" header={header}>
                <ScrollView
                    className="flex-initial"
                    contentContainerClassName={contentClassName}
                    bounces={false}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {children}
                </ScrollView>

                {footer}
            </SheetSurface>
        </View>
    );
};
