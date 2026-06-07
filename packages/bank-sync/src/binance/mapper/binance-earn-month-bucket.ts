export class BinanceEarnMonthBucket {
    totalMicroUnits = 0;
    lastRewardTime = 0;

    constructor(readonly monthKey: string) {}

    add(rewardMicroUnits: number, rewardTime: number): void {
        this.totalMicroUnits += rewardMicroUnits;
        this.lastRewardTime = Math.max(this.lastRewardTime, rewardTime);
    }
}
