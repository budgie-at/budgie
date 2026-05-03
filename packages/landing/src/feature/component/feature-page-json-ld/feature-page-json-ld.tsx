import { JsonLd } from '../../../generic/component/json-ld/json-ld';

interface Props {
    readonly schemas: readonly Record<string, unknown>[];
}

export const FeaturePageJsonLd = ({ schemas }: Props) => (
    <>
        {schemas.map((schema, index) => (
            <JsonLd key={`schema-${index}`} data={schema} />
        ))}
    </>
);
