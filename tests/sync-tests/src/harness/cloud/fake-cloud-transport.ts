import * as Schema from 'effect/Schema';

import type { FakeCloudDeliveryOptionsInterface } from './fake-cloud-delivery-options.interface';
import type { SyncApplyBatchInterface, SyncIncomingDeletionInterface, SyncIncomingRecordInterface } from '@budgie/cloud-sync';

interface StoredChangeInterface {
    readonly version: number;
    readonly zone: string;
    readonly recordName: string;
    readonly record: unknown;
    readonly recordType: string;
}

const SHUFFLE_MULTIPLIER = 7919;

const EnvelopeSchema = Schema.Struct({ zone: Schema.String, recordName: Schema.String, recordType: Schema.String });
const decodeEnvelope = Schema.decodeUnknownSync(EnvelopeSchema);
const cloneJson = (value: unknown): unknown => structuredClone(value);

export class FakeCloudTransport {
    private readonly changes = new Map<string, StoredChangeInterface>();
    private readonly cursors = new Map<string, number>();
    private readonly zoneAccess = new Map<string, Set<string>>();
    private readonly lostZones = new Map<string, Set<string>>();
    private version = 0;

    upload(records: readonly unknown[]): readonly string[] {
        return records.map(record => {
            const envelope = cloneJson(record);
            const { zone, recordName, recordType } = decodeEnvelope(envelope);

            this.version += 1;
            this.changes.set(`${zone}|${recordName}`, { version: this.version, zone, recordName, recordType, record: envelope });

            return this.systemFieldsFor(this.version);
        });
    }

    remove(recordType: string, zone: string, recordName: string): void {
        this.version += 1;
        this.changes.set(`${zone}|${recordName}`, { version: this.version, zone, recordName, recordType, record: null });
    }

    inventory(zone: string): ReadonlySet<string> {
        return new Set(
            [...this.changes.values()].filter(change => change.zone === zone && change.record !== null).map(({ recordName }) => recordName)
        );
    }

    shareZone(zone: string, accountIds: readonly string[]): void {
        this.zoneAccess.set(zone, new Set(accountIds));
    }

    acceptShare(zone: string, accountId: string): void {
        this.zoneAccess.set(zone, new Set([...(this.zoneAccess.get(zone) ?? []), accountId]));
    }

    revokeShare(zone: string, accountId: string): void {
        this.zoneAccess.get(zone)?.delete(accountId);
        this.lostZones.set(accountId, new Set([...(this.lostZones.get(accountId) ?? []), zone]));
    }

    deleteZone(zone: string): void {
        for (const change of [...this.changes.values()].filter(candidate => candidate.zone === zone && candidate.record !== null)) {
            this.remove(change.recordType, zone, change.recordName);
        }

        for (const accountId of this.zoneAccess.get(zone) ?? []) {
            this.revokeShare(zone, accountId);
        }
    }

    takeLostZones(accountId: string): readonly string[] {
        const lost = [...(this.lostZones.get(accountId) ?? [])];

        this.lostZones.delete(accountId);

        return lost;
    }

    systemFieldsFor(version: number): string {
        return `system-fields-${version}`;
    }

    latestSystemFields(zone: string, recordName: string): string | null {
        const change = this.changes.get(`${zone}|${recordName}`);

        return change === undefined ? null : this.systemFieldsFor(change.version);
    }

    pull(deviceId: string, options: FakeCloudDeliveryOptionsInterface = {}): readonly SyncApplyBatchInterface[] {
        const cursor = this.cursors.get(deviceId) ?? 0;
        const pending = [...this.changes.values()]
            .filter(change => change.version > cursor && this.isVisible(change.zone, options.accountId))
            .sort((left, right) => left.version - right.version);
        const ordered = this.reorder(pending, options.order ?? 'upload');
        const chunkSize = options.chunkSize ?? Math.max(ordered.length, 1);
        const batches: SyncApplyBatchInterface[] = [];

        for (let offset = 0; offset < ordered.length; offset += chunkSize) {
            batches.push(this.toBatch(ordered.slice(offset, offset + chunkSize)));
        }

        this.cursors.set(deviceId, this.version);

        return options.isDuplicated === true ? [...batches, ...batches] : batches;
    }

    private isVisible(zone: string, accountId: string | undefined): boolean {
        const access = this.zoneAccess.get(zone);

        return access === undefined || accountId === undefined || access.has(accountId);
    }

    private reorder(changes: readonly StoredChangeInterface[], order: 'upload' | 'reverse' | 'shuffled'): readonly StoredChangeInterface[] {
        if (order === 'reverse') {
            return [...changes].reverse();
        }

        if (order === 'shuffled') {
            return [...changes].sort(
                (left, right) => ((left.version * SHUFFLE_MULTIPLIER) % 101) - ((right.version * SHUFFLE_MULTIPLIER) % 101)
            );
        }

        return changes;
    }

    private toBatch(changes: readonly StoredChangeInterface[]): SyncApplyBatchInterface {
        const records: SyncIncomingRecordInterface[] = changes
            .filter(({ record }) => record !== null)
            .map(change => ({ record: cloneJson(change.record), systemFields: this.systemFieldsFor(change.version) }));
        const deletions: SyncIncomingDeletionInterface[] = changes
            .filter(({ record }) => record === null)
            .map(({ recordType, recordName, zone }) => ({ recordType, recordName, zone }));

        return { records, deletions };
    }
}
