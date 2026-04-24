import { createLogDecorator } from '@rnw-community/log-decorator';

import { consoleTransport } from './console-transport.util';

// Explicit type annotation avoids TS2742 "cannot be named without reference to private package"
export const Log: ReturnType<typeof createLogDecorator> = createLogDecorator({ transport: consoleTransport });
