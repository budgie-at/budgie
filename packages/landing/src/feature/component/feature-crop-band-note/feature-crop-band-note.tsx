import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

export const FeatureCropBandNote = ({ children }: Props) => <li className="feature-crop-band-note">{children}</li>;
