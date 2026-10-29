import { TagsSelectorActionTypeEnum } from '../enum/tags-selector-action-type.enum';

export interface TagsSelectorActionInterface {
    readonly type: TagsSelectorActionTypeEnum;
    readonly tagId: number;
}
