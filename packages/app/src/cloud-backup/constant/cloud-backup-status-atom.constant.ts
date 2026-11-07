import * as Atom from 'effect/reactivity/Atom';

import { CloudBackupStatusEnum } from '../enum/cloud-backup-status.enum';

export const cloudBackupStatusAtom = Atom.keepAlive(Atom.make(CloudBackupStatusEnum.READY));
