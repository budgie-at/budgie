import type { ModalRegistryInterface } from '../interface/modal-registry.interface';
import type { ModalRoute } from './modal-route.type';

export type ModalResult<TRoute extends ModalRoute> = ModalRegistryInterface[TRoute]['result'];
