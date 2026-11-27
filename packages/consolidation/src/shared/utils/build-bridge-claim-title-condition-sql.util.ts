const BRIDGE_CLAIM_TITLE_MARKERS = [
    { currencyCode: 'EUR', titleMarkers: ['єврового', 'Єврового', 'ЄВРОВОГО'] },
    { currencyCode: 'USD', titleMarkers: ['доларового', 'Доларового', 'ДОЛАРОВОГО'] },
    { currencyCode: 'UAH', titleMarkers: ['гривневого', 'Гривневого', 'ГРИВНЕВОГО'] }
] as const;

export const buildBridgeClaimTitleConditionSql = (titleColumn: string, currencyCodeColumn: string): string =>
    `(${BRIDGE_CLAIM_TITLE_MARKERS.map(
        ({ currencyCode, titleMarkers }) =>
            `((${titleMarkers.map(titleMarker => `${titleColumn} LIKE '%${titleMarker}%'`).join(' OR ')}) AND ${currencyCodeColumn} != '${currencyCode}')`
    ).join(' OR ')})`;
