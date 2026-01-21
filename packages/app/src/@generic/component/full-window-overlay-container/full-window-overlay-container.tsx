import { ReactNode } from 'react';
import { FullWindowOverlay } from 'react-native-screens';

interface Props {
    readonly children?: ReactNode;
}

export const FullWindowOverlayContainer = ({ children }: Props) => <FullWindowOverlay>{children}</FullWindowOverlay>;
