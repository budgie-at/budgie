import { TagRepository } from '@budgie/contracts';
import * as Layer from 'effect/Layer';

import { TagService } from '../../tag/service/tag.service';
import { Workload } from '../service/workload.service';

export const appServicesLayer = Layer.mergeAll(Workload.layer, TagRepository.layer, TagService.layer);
