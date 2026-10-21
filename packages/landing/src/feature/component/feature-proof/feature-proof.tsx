import { FeatureProofAction } from '../feature-proof-action/feature-proof-action';
import { FeatureProofFact } from '../feature-proof-fact/feature-proof-fact';
import { FeatureProofSource } from '../feature-proof-source/feature-proof-source';
import { FeatureShotCrop } from '../feature-shot-crop/feature-shot-crop';

import type { ReactNode } from 'react';

interface Props {
    readonly heading: ReactNode;
    readonly lede: ReactNode;
    readonly crop: ReactNode;
    readonly children: ReactNode;
}

const FeatureProofRoot = ({ heading, lede, crop, children }: Props) => (
    <section className="feature-section">
        <div className="container">
            <div className="feature-proof">
                <div className="feature-proof-copy">
                    <h2 className="feature-section-title">{heading}</h2>
                    <p className="feature-section-lede">{lede}</p>
                    {children}
                </div>
                {crop}
            </div>
        </div>
    </section>
);

export const FeatureProof = Object.assign(FeatureProofRoot, {
    Fact: FeatureProofFact,
    Action: FeatureProofAction,
    Source: FeatureProofSource,
    Crop: FeatureShotCrop
});
