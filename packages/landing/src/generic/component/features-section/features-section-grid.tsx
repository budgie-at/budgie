import { FeaturesSectionGridMotion } from './features-section-grid-motion';

interface Props {
    readonly locale: string;
}

export const FeaturesSectionGrid = ({ locale: _locale }: Props) => (
    <FeaturesSectionGridMotion>{null}</FeaturesSectionGridMotion>
);
