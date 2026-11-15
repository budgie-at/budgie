const AI_NATIVE_MODULES = ['llama.rn', 'react-native-audio-api', 'whisper.rn'];

module.exports = {
    dependencies:
        process.env.EXPO_PUBLIC_AI_DISABLE === 'true'
            ? Object.fromEntries(AI_NATIVE_MODULES.map(name => [name, { platforms: { android: null, ios: null } }]))
            : {}
};
