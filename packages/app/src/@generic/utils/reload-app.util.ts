export const reloadApp = async () => {
    const updatesModule = await import('expo-updates/build/Updates');

    await updatesModule.reloadAsync();
};
