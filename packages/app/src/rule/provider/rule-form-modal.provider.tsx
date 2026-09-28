import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';
import { RuleFormModalContext } from '../context/rule-form-modal.context';

export const RuleFormModalProvider = createModalProvider(RuleFormModalContext, '/rule-form');
