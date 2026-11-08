import { FakeCloudTransport } from './fake-cloud-transport';

import type { ShareCloudsInterface } from './share-harness';

export const OPERATED_AT = new Date('2026-10-02T10:00:00Z');
export const makeShareClouds = (): ShareCloudsInterface => ({ personal: new FakeCloudTransport(), household: new FakeCloudTransport() });
