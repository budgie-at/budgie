import * as Duration from 'effect/Duration';

export const formatPinLockoutTime = (remainingMillis: number): string => {
    const totalSeconds = Math.ceil(Duration.toSeconds(Duration.millis(remainingMillis)));
    const seconds = String(totalSeconds % 60).padStart(2, '0');

    return `${Math.floor(totalSeconds / 60)}:${seconds}`;
};
