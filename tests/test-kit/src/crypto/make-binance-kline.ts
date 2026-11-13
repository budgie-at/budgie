const DAY_MILLISECONDS = 86_400_000;

export const makeBinanceKline = (day: string, open: number) => {
    const openTime = Date.parse(`${day}T00:00:00.000Z`);

    return [openTime, String(open), '0', '0', '0', '0', openTime + DAY_MILLISECONDS - 1, '0', 0, '0', '0', '0'];
};
