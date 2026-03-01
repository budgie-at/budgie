import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';
import { RuleMccSelectorModalContext } from '../context/rule-mcc-selector-modal.context';

export const RuleMccSelectorModalProvider = createModalProvider(RuleMccSelectorModalContext, '/rule-mcc-selector');
