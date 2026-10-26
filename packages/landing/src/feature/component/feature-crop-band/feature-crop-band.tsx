import { FeatureCropBandNote } from '../feature-crop-band-note/feature-crop-band-note';
import { FeatureCropBandPin } from '../feature-crop-band-pin/feature-crop-band-pin';
import { FeatureShotCrop } from '../feature-shot-crop/feature-shot-crop';

import type { ReactNode } from 'react';

interface Props {
    readonly heading: ReactNode;
    readonly lede: ReactNode;
    readonly shot: ReactNode;
    readonly children: ReactNode;
}

const FeatureCropBandRoot = ({ heading, lede, shot, children }: Props) => (
    <section className="feature-section">
        <div className="container">
            <div className="feature-crop-band">
                <div className="feature-crop-band-copy">
                    <h2 className="feature-section-title">{heading}</h2>
                    <p className="feature-section-lede">{lede}</p>
                    <ol className="feature-crop-band-notes">{children}</ol>
                </div>
                {shot}
            </div>
        </div>
    </section>
);

export const FeatureCropBand = Object.assign(FeatureCropBandRoot, {
    Note: FeatureCropBandNote,
    Shot: FeatureShotCrop,
    Pin: FeatureCropBandPin
});
