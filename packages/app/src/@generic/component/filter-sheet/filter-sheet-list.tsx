import { ReactNode } from 'react';
import { ScrollView } from 'react-native';

interface Props {
    readonly children: ReactNode;
}

export const FilterSheetList = ({ children }: Props) => (
    <ScrollView
        className="flex-1"
        contentContainerClassName="gap-y-md px-xl py-lg"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
    >
        {children}
    </ScrollView>
);
