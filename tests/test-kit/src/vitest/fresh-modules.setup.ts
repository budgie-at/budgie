import { afterAll, vi } from 'vitest';

import { disposeTestDatabases } from '../db/test-database-disposer';

vi.resetModules();

afterAll(disposeTestDatabases);
