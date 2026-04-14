/* eslint-disable lingui/no-unlocalized-strings, @rnw-community/no-complex-jsx-logic */
import { msg } from '@lingui/core/macro';
import { ImageResponse } from 'next/og';

import linguiConfig from '../../../lingui.config.mjs';
import { getI18nInstance } from '../../i18n/app-router-i18n';
import { PageLangParam } from '../../i18n/init-lingui';

export const alt = 'Budgie - Privacy-First Expense Tracker';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// eslint-disable-next-line func-style
export async function generateStaticParams() {
    return linguiConfig.locales.map(lang => ({ lang }));
}

const backgroundStyle = {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    width: '100%',
    height: '100%',
    display: 'flex' as const,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: '60px'
};

const logoContainerStyle = {
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '16px',
    marginBottom: '40px'
};

const logoStyle = {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #22c55e, #10b981)',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    fontSize: '36px',
    color: 'white'
};

const titleStyle = {
    fontSize: '56px',
    fontWeight: 700,
    color: 'white',
    textAlign: 'center' as const,
    lineHeight: 1.2,
    margin: '0 0 24px 0'
};

const subtitleStyle = {
    fontSize: '24px',
    color: '#94a3b8',
    textAlign: 'center' as const,
    maxWidth: '800px',
    lineHeight: 1.5,
    margin: 0
};

const badgeContainerStyle = {
    display: 'flex' as const,
    gap: '24px',
    marginTop: '48px'
};

const createBadgeStyle = (color: string) => ({
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '8px',
    background: `${color}26`,
    border: `1px solid ${color}4d`,
    borderRadius: '24px',
    padding: '8px 20px',
    fontSize: '18px',
    color
});

const OgImage = async ({ params }: PageLangParam) => {
    const { lang } = await params;
    const i18n = getI18nInstance(lang);

    const title = i18n._(msg`Privacy-First Expense Tracker`);
    const subtitle = i18n._(msg`Track expenses, sync banks, manage crypto & investments — all offline, encrypted, and on your device.`);
    const offlineLabel = i18n._(msg`100% Offline`);
    const encryptedLabel = i18n._(msg`Encrypted`);
    const openSourceLabel = i18n._(msg`Open Source`);

    return new ImageResponse(
        <div style={backgroundStyle}>
            <div style={logoContainerStyle}>
                <div style={logoStyle}>B</div>

                <span style={{ fontSize: '48px', fontWeight: 700, color: 'white' }}>Budgie</span>
            </div>

            <h1 style={titleStyle}>{title}</h1>

            <p style={subtitleStyle}>{subtitle}</p>

            <div style={badgeContainerStyle}>
                <div style={createBadgeStyle('#22c55e')}>{offlineLabel}</div>

                <div style={createBadgeStyle('#3b82f6')}>{encryptedLabel}</div>

                <div style={createBadgeStyle('#a855f7')}>{openSourceLabel}</div>
            </div>
        </div>,
        { ...size }
    );
};

export default OgImage;
