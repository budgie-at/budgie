import { customType } from 'drizzle-orm/sqlite-core';

export const uint8BlobColumn = customType<{ data: Uint8Array; driverData: ArrayBuffer | Uint8Array }>({
    dataType: () => 'blob',
    toDriver: (value: Uint8Array) => value,
    fromDriver: (value: ArrayBuffer | Uint8Array) => new Uint8Array(value)
});
