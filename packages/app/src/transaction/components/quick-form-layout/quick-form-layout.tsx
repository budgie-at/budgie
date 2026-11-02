import { ReactNode } from 'react';
import { ScrollView } from 'react-native';

interface Props {
    readonly children: ReactNode;
}

export const QuickFormLayout = ({ children }: Props) => (
    <ScrollView className="flex-1" contentContainerClassName="grow pt-[24px]" showsVerticalScrollIndicator={false} bounces={false}>
        {children}
    </ScrollView>
);
