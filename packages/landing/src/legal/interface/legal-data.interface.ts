export interface LegalMetadataInterface {
    title: string;
    slug: string;
    date: string;
    author: string;
    lastUpdated: string;
}

export interface LegalDataInterface {
    default: React.ComponentType;
    metadata: LegalMetadataInterface;
}
