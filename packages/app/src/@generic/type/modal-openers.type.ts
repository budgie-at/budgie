import type { ModalOpener } from './modal-opener.type';
import type { ModalRoute } from './modal-route.type';

export type ModalOpeners<TRoutes extends ModalRoute = ModalRoute> = { [TRoute in TRoutes]?: ModalOpener<TRoute> };
