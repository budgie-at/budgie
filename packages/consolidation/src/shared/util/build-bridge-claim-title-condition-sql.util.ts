const BRIDGE_CLAIM_TITLE_MARKERS = [
    { currencyCode: 'EUR', titleMarker: 'єврового' },
    { currencyCode: 'USD', titleMarker: 'доларового' },
    { currencyCode: 'UAH', titleMarker: 'гривневого' }
] as const;

export const buildBridgeClaimTitleConditionSql = (titleColumn: string, currencyCodeColumn: string): string =>
    BRIDGE_CLAIM_TITLE_MARKERS.map(
        ({ currencyCode, titleMarker }) => `(${titleColumn} LIKE '%${titleMarker}%' AND ${currencyCodeColumn} != '${currencyCode}')`
    ).join(' OR ');
