export const normalizeRouteParam = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value);
