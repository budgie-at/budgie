/* oxlint-disable lingui/no-unlocalized-strings */
import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { OgCardDevice } from './og-card-device';

const WIDE_COPY_WIDTH = '980px';
const FRAMED_COPY_WIDTH = '660px';
const LONG_TITLE_LENGTH = 64;
const MEDIUM_TITLE_LENGTH = 40;

const canvasStyle = {
    position: 'relative' as const,
    width: '100%',
    height: '100%',
    display: 'flex' as const,
    background: 'linear-gradient(115deg, #03120c 0%, #061d17 38%, #04080f 100%)'
};

const layerStyle = { position: 'absolute' as const, top: 0, left: 0, width: '1200px', height: '630px' };

const railStyle = {
    ...layerStyle,
    height: '5px',
    background: 'linear-gradient(90deg, #22c55e 0%, #10b981 42%, rgba(16, 185, 129, 0) 100%)'
};

const glowStyle = {
    ...layerStyle,
    background: 'radial-gradient(circle at 78% 18%, rgba(16, 185, 129, 0.34) 0%, rgba(16, 185, 129, 0) 62%)'
};

const contentStyle = {
    position: 'relative' as const,
    display: 'flex' as const,
    flexDirection: 'column' as const,
    justifyContent: 'space-between' as const,
    flex: 1,
    padding: '58px 56px 52px'
};

const brandRowStyle = { display: 'flex' as const, alignItems: 'center' as const, gap: '16px' };

const markStyle = {
    width: '46px',
    height: '46px',
    borderRadius: '13px',
    background: 'linear-gradient(135deg, #34d399, #059669)',
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    fontSize: '26px',
    fontWeight: 700,
    color: '#04130c'
};

const wordmarkStyle = { fontSize: '27px', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.4px' };

const dividerStyle = { width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.2)' };

const labelStyle = { fontSize: '15px', fontWeight: 600, color: '#6ee7b7', letterSpacing: '2.8px' };

const copyStyle = { display: 'flex' as const, flexDirection: 'column' as const, gap: '20px', paddingTop: '34px' };

const taglineStyle = { fontSize: '23px', color: '#9fb3c8', lineHeight: 1.45, maxWidth: '600px' };

const footerStyle = { display: 'flex' as const, alignItems: 'center' as const, gap: '28px' };

const tagRowStyle = { display: 'flex' as const, gap: '10px' };

const tagStyle = {
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(52, 211, 153, 0.32)',
    borderRadius: '999px',
    padding: '7px 16px',
    fontSize: '17px',
    color: '#86efac'
};

const domainStyle = { fontSize: '19px', color: '#64748b', letterSpacing: '0.4px' };

const resolveTitleFontSize = (title: string) => {
    if (title.length > LONG_TITLE_LENGTH) {
        return '40px';
    }

    if (title.length > MEDIUM_TITLE_LENGTH) {
        return '48px';
    }

    return '58px';
};

interface Props {
    title: string;
    label: string;
    tags: readonly string[];
    tagline?: string;
    plate?: string;
}

export const OgCard = ({ title, label, tags, tagline, plate }: Props) => {
    const titleStyle = {
        fontSize: resolveTitleFontSize(title),
        fontWeight: 700,
        color: '#ffffff',
        lineHeight: 1.06,
        letterSpacing: '-1.4px',
        maxWidth: isDefined(plate) ? FRAMED_COPY_WIDTH : WIDE_COPY_WIDTH
    };

    return (
        <div style={canvasStyle}>
            <div style={railStyle} />

            <div style={glowStyle} />

            {isDefined(plate) ? <OgCardDevice plate={plate} /> : null}

            <div style={contentStyle}>
                <div style={brandRowStyle}>
                    <div style={markStyle}>B</div>

                    <span style={wordmarkStyle}>Budgie</span>

                    <div style={dividerStyle} />

                    <span style={labelStyle}>{label.toUpperCase()}</span>
                </div>

                <div style={copyStyle}>
                    <div style={titleStyle}>{title}</div>

                    {isNotEmptyString(tagline) ? <div style={taglineStyle}>{tagline}</div> : null}
                </div>

                <div style={footerStyle}>
                    <div style={tagRowStyle}>
                        {tags.slice(0, 3).map(tag => (
                            <span key={tag} style={tagStyle}>
                                {tag}
                            </span>
                        ))}
                    </div>

                    <span style={domainStyle}>budgie.at</span>
                </div>
            </div>
        </div>
    );
};
