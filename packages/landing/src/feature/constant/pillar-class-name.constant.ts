import { PillarEnum } from './pillar.enum';

export const PILLAR_CLASS_NAME: Record<PillarEnum, string> = {
    [PillarEnum.BANK]: 'pillar-bank',
    [PillarEnum.AI]: 'pillar-ai',
    [PillarEnum.PRIVACY]: 'pillar-privacy',
    [PillarEnum.PLANNING]: 'pillar-planning'
};
