import { Text } from 'react-native';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

export const CloudBackupRestoreNotice = ({ children }: Props) => (
    <Text className="text-secondary-foreground px-3xl text-[13px] leading-[18px]">{children}</Text>
);
