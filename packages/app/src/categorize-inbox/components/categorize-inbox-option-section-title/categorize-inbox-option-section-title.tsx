import { Text } from 'react-native';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

export const CategorizeInboxOptionSectionTitle = ({ children }: Props) => (
    <Text className="text-primary px-3xl pb-sm pt-5xl text-[15px] font-semibold" accessibilityRole="header">
        {children}
    </Text>
);
