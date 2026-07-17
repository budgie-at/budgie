import { ReactNode } from 'react';
import Svg, { ClipPath, Defs, G, Rect } from 'react-native-svg';

interface Props {
    readonly size: number;
    readonly clipId: string;
    readonly backgroundColor: string;
    readonly children: ReactNode;
}

const VIEWBOX_WIDTH = 30;
const VIEWBOX_HEIGHT = 20;
const CORNER_RADIUS = 3;

export const FlagBase = ({ size, clipId, backgroundColor, children }: Props) => {
    const height = (size * VIEWBOX_HEIGHT) / VIEWBOX_WIDTH;

    return (
        <Svg width={size} height={height} viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}>
            <Defs>
                <ClipPath id={clipId}>
                    <Rect width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} rx={CORNER_RADIUS} />
                </ClipPath>
            </Defs>
            <G clipPath={`url(#${clipId})`}>
                <Rect width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill={backgroundColor} />
                {children}
            </G>
        </Svg>
    );
};
