export const copyAudioDataToBuffer = (audioData: Uint8Array): ArrayBuffer => {
    const audioBuffer = new ArrayBuffer(audioData.byteLength);
    const audioBufferView = new Uint8Array(audioBuffer);

    audioBufferView.set(audioData);

    return audioBuffer;
};
