import * as Logger from 'effect/Logger';

export const makeLoggerLayer = (isEnabled: boolean) =>
    Logger.layer(isEnabled ? [Logger.consolePretty({ colors: false, mode: 'browser' })] : []);
