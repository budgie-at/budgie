import { View } from 'react-native';

export const SheetBottomFade = () => (
    <View pointerEvents="none" className="absolute bottom-0 left-0 right-0 z-20 h-[28px] bg-linear-to-t from-surface to-surface/0" />
);
