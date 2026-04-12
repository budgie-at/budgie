/* eslint-disable lingui/no-unlocalized-strings */
import { ImageResponse } from 'next/og';

export const alt = 'Budgie Blog';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const TITLE = 'Why Cloud Budgeting Apps Are a Privacy Nightmare';
const TAGS = ['privacy', 'security', 'cloud risks'];

const backgroundStyle = {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    width: '100%',
    height: '100%',
    display: 'flex' as const,
    flexDirection: 'column' as const,
    justifyContent: 'space-between' as const,
    padding: '60px'
};

const tagStyle = {
    background: 'rgba(34, 197, 94, 0.15)',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    borderRadius: '16px',
    padding: '6px 16px',
    fontSize: '16px',
    color: '#22c55e'
};

const titleStyle = {
    fontSize: '52px',
    fontWeight: 700,
    color: 'white',
    lineHeight: 1.2,
    margin: 0,
    maxWidth: '900px'
};

const logoStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #22c55e, #10b981)',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    fontSize: '22px',
    color: 'white'
};

const OgImage = () =>
    new ImageResponse(
        <div style={backgroundStyle}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
                    {TAGS.slice(0, 3).map(tag => (
                        <span key={tag} style={tagStyle}>
                            {tag}
                        </span>
                    ))}
                </div>
                <h1 style={titleStyle}>{TITLE}</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={logoStyle}>B</div>
                    <span style={{ fontSize: '24px', fontWeight: 600, color: 'white' }}>Budgie Blog</span>
                </div>
                <span style={{ fontSize: '18px', color: '#64748b' }}>budgie.at</span>
            </div>
        </div>,
        { ...size }
    );

export default OgImage;
