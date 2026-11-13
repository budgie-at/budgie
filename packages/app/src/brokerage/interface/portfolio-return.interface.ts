export interface PortfolioReturnInterface {
    readonly gain: number;
    readonly percent: number | null;
    readonly positionGains: readonly (number | null)[];
}
