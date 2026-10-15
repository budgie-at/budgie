import { useAtomValue } from '@effect/atom-react/Hooks';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { networkTypeAtom } from '../constant/network-type-atom.constant';
import { NetworkTypeEnum } from '../enum/network-type.enum';

export const useNetworkType = (): NetworkTypeEnum => AsyncResult.getOrElse(useAtomValue(networkTypeAtom), () => NetworkTypeEnum.UNKNOWN);
