/* oxlint-disable lingui/no-unlocalized-strings */
import { ImageResponse } from 'next/og';

export const alt = 'Budgie';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

const backgroundStyle = {
    background: '#0f172a',
    width: '100%',
    height: '100%',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const
};

const badgeStyle = {
    width: '20px',
    height: '20px',
    borderRadius: '5px',
    background: 'linear-gradient(135deg, #22c55e, #10b981)'
};

const Icon = () =>
    new ImageResponse(
        <div style={backgroundStyle}>
            <div style={badgeStyle} />
        </div>,
        { ...size }
    );

export default Icon;
