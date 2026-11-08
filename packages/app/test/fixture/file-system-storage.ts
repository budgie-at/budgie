export class FileSystemStorage {
    readonly files = new Map<string, string>();
    readonly modified = new Map<string, number>();
    readonly events = new Array<string>();
    readonly deleted = new Array<string>();
    failWrite = false;
    failCopy = false;
    failMoveFrom: string | null = null;
    crashAfterRemove = false;
}
