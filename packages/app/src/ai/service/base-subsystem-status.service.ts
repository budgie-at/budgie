import { AiSubsystemCardStateEnum } from '../enum/ai-subsystem-card-state.enum';
import { AiSystemUmbrellaStateEnum } from '../enum/ai-system-umbrella-state.enum';
import { AiSubsystemStatusSnapshotInterface } from '../interface/ai-subsystem-status-snapshot.interface';

import { aiUmbrellaStatusService } from './ai-umbrella-status.service';
import { ScheduledSnapshotStore } from './base-subsystem.service';

export const EMPTY_SUBSYSTEM_SNAPSHOT: AiSubsystemStatusSnapshotInterface = {
    state: AiSubsystemCardStateEnum.HIDDEN,
    statusText: '',
    percent: 0,
    pending: 0,
    total: 0,
    errorMessage: null
};

export abstract class BaseSubsystemStatusService extends ScheduledSnapshotStore<AiSubsystemStatusSnapshotInterface> {
    constructor() {
        super(EMPTY_SUBSYSTEM_SNAPSHOT);
    }

    protected emptySnapshot(): AiSubsystemStatusSnapshotInterface {
        return EMPTY_SUBSYSTEM_SNAPSHOT;
    }

    protected recompute(): void {
        const next = this.derive();
        if (this.snapshotEquals(next)) {
            return;
        }
        this.setSnapshot(next);
    }

    protected buildSubscriptions(): (() => void)[] {
        return [aiUmbrellaStatusService.subscribe(this.scheduleRecompute), ...this.buildSubsystemSubscriptions()];
    }

    protected isUmbrellaHealthy(): boolean {
        return aiUmbrellaStatusService.getSnapshot().state === AiSystemUmbrellaStateEnum.Healthy;
    }

    private snapshotEquals(next: AiSubsystemStatusSnapshotInterface): boolean {
        return (
            this.snapshot.state === next.state &&
            this.snapshot.statusText === next.statusText &&
            this.snapshot.percent === next.percent &&
            this.snapshot.pending === next.pending &&
            this.snapshot.total === next.total &&
            this.snapshot.errorMessage === next.errorMessage
        );
    }

    protected abstract buildSubsystemSubscriptions(): (() => void)[];
    protected abstract derive(): AiSubsystemStatusSnapshotInterface;
}
