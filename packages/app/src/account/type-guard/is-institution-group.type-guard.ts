import type { InstitutionGroupInterface } from '../interface/institution-group.interface';

export const isInstitutionGroup = (item: object): item is InstitutionGroupInterface => 'provider' in item;
