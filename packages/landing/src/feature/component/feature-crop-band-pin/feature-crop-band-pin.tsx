interface Props {
    readonly x: number;
    readonly y: number;
}

export const FeatureCropBandPin = ({ x, y }: Props) => {
    const pinPosition = { left: `${x * 100}%`, top: `${y * 100}%` };

    return <span aria-hidden="true" className="feature-crop-pin" style={pinPosition} />;
};
