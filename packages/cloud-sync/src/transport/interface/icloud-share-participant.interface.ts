import { ICloudParticipantAcceptanceStatus } from '../enum/icloud-participant-acceptance-status.enum';
import { ICloudParticipantPermission } from '../enum/icloud-participant-permission.enum';
import { ICloudParticipantRole } from '../enum/icloud-participant-role.enum';

export interface ICloudShareParticipant {
    readonly participantId: string;
    readonly displayName: string | null;
    readonly role: ICloudParticipantRole;
    readonly acceptanceStatus: ICloudParticipantAcceptanceStatus;
    readonly permission: ICloudParticipantPermission;
    readonly isCurrentUser: boolean;
}
