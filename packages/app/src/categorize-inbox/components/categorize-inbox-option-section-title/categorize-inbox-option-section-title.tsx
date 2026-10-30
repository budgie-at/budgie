import { Text } from 'react-native';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

export const CategorizeInboxOptionSectionTitle = ({ children }: Props) => (
    <Text className="text-secondary-foreground px-3xl pb-sm pt-5xl text-[13px] font-semibold" accessibilityRole="header">
        {children}
    </Text>
);
