/* eslint-disable lingui/no-unlocalized-strings */
import { t } from '@lingui/core/macro';
import { ImageResponse } from 'next/og';

import { getI18nInstance } from '../../../../i18n/app-router-i18n';

export const alt = 'Best YNAB Alternatives for Privacy-Conscious Users (2025)';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

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


const columnStyle = { display: 'flex' as const, flexDirection: 'column' as const };

const tagsContainerStyle = { display: 'flex' as const, gap: '12px', marginBottom: '32px' };

const footerStyle = { display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const };

const brandStyle = { display: 'flex' as const, alignItems: 'center' as const, gap: '12px' };

const brandTextStyle = { fontSize: '24px', fontWeight: 600, color: 'white' };

const domainStyle = { fontSize: '18px', color: '#64748b' };
const OgImage = async ({ params }: { params: Promise<{ lang: string }> }) => {
    const { lang } = await params;
    const i18n = getI18nInstance(lang);

    const title = t(i18n)`Best YNAB Alternatives for Privacy-Conscious Users (2025)`;
    const tags = [t(i18n)`ynab`, t(i18n)`alternatives`, t(i18n)`privacy`];

    return new ImageResponse(
        <div style={backgroundStyle}>
            <div style={columnStyle}>
                <div style={tagsContainerStyle}>
                    {tags.slice(0, 3).map(tag => (
                        <span key={tag} style={tagStyle}>
                            {tag}
                        </span>
                    ))}
                </div>
                <h1 style={titleStyle}>{title}</h1>
            </div>
            <div style={footerStyle}>
                <div style={brandStyle}>
                    <div style={logoStyle}>B</div>
                    <span style={brandTextStyle}>Budgie Blog</span>
                </div>
                <span style={domainStyle}>budgie.at</span>
            </div>
        </div>,
        { ...size }
    );
};

export default OgImage;
