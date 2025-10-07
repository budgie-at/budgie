export interface BaseEntityInterface {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}
