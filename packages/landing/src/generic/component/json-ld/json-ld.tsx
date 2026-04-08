import type { ReactElement } from 'react';

interface Props {
    data: Record<string, unknown>;
}

export const JsonLd = ({ data }: Props): ReactElement => {
    const innerHtml = { __html: JSON.stringify(data) };

    return <script dangerouslySetInnerHTML={innerHtml} type="application/ld+json" />;
};
