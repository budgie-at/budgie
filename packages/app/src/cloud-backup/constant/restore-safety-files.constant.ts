export const RESTORE_SAFETY_FILES = {
    copy: 'pre-restore.db',
    partial: 'pre-restore.db.partial',
    recovering: 'pre-restore.db.recovering',
    pending: 'pre-restore.pending',
    source: 'cloud-restore-source.db',
    target: 'cloud-restore-target.db'
} as const;
