import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';
import { RuleSelectorModalContext } from '../context/rule-selector-modal.context';

export const RuleSelectorModalProvider = createModalProvider(RuleSelectorModalContext, '/rule-selector');
