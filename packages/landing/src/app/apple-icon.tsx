/* oxlint-disable lingui/no-unlocalized-strings */
import { ImageResponse } from 'next/og';

export const alt = 'Budgie';
export const size = { width: 180, height: 180 };
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
    width: '120px',
    height: '120px',
    borderRadius: '28px',
    background: 'linear-gradient(135deg, #22c55e, #10b981)'
};

const AppleIcon = () =>
    new ImageResponse(
        <div style={backgroundStyle}>
            <div style={badgeStyle} />
        </div>,
        { ...size }
    );

export default AppleIcon;
