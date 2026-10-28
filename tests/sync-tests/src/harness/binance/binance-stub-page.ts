export const EARN_PAGING = { pageParam: 'current', sizeParam: 'size', defaultSize: 10, maxSize: 100 };
export const FIAT_PAGING = { pageParam: 'page', sizeParam: 'rows', defaultSize: 100, maxSize: 500 };
export const C2C_PAGING = { pageParam: 'page', sizeParam: 'rows', defaultSize: 10, maxSize: 100 };

export const parseLimit = (url: URL, defaultLimit: number, maxLimit: number): number =>
    Math.min(Number(url.searchParams.get('limit') ?? String(defaultLimit)), maxLimit);

export const slicePage = <TRow>(url: URL, rows: readonly TRow[], paging: typeof EARN_PAGING): TRow[] => {
    const page = Number(url.searchParams.get(paging.pageParam) ?? '1');
    const size = Math.min(Number(url.searchParams.get(paging.sizeParam) ?? String(paging.defaultSize)), paging.maxSize);

    return rows.slice((page - 1) * size, page * size);
};
