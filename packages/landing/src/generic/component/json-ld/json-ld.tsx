interface Props {
    data: Record<string, unknown>;
}

export const JsonLd = ({ data }: Props) => {
    const html = { __html: JSON.stringify(data) };

    return <script dangerouslySetInnerHTML={html} type="application/ld+json" />;
};
