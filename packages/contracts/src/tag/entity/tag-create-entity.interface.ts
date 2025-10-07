import { TagEntityInterface } from '@/tag';

const TagCreateEntityFields = ['title'] as const;

export interface TagCreateEntityInterface extends Pick<TagEntityInterface, (typeof TagCreateEntityFields)[number]> {}
