export const calculateRMS = (samples: Float32Array): number => {
    let sum = 0;
    for (let i = 0; i < samples.length; i += 1) {
        sum += samples[i] * samples[i];
    }

    return Math.sqrt(sum / samples.length);
};
