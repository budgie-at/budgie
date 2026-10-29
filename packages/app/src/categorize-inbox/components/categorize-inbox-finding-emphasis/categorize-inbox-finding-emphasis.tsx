import { Text } from 'react-native';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

export const CategorizeInboxFindingEmphasis = ({ children }: Props) => <Text className="text-primary font-semibold">{children}</Text>;
