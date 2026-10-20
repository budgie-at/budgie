import { AiSystemUmbrellaStateEnum } from '../enum/ai-system-umbrella-state.enum';

export interface AiSystemUmbrellaSnapshotInterface {
    readonly state: AiSystemUmbrellaStateEnum;
    readonly statusText: string;
    readonly errorMessage: string | null;
}
