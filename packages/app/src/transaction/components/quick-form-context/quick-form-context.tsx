import { View } from 'react-native';

import type { PropsWithChildren } from 'react';

export const QuickFormContext = ({ children }: PropsWithChildren) => (
    <View className="h-[108px] overflow-hidden justify-center">{children}</View>
);
