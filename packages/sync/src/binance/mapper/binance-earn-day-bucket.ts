export class BinanceEarnDayBucket {
    constructor(
        readonly dayKey: string,
        readonly totalMicroUnits = 0,
        readonly lastRewardTime = 0
    ) {}

    add(rewardMicroUnits: number, rewardTime: number): BinanceEarnDayBucket {
        return new BinanceEarnDayBucket(this.dayKey, this.totalMicroUnits + rewardMicroUnits, Math.max(this.lastRewardTime, rewardTime));
    }
}
