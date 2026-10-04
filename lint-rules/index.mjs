import camelcase from './rules/camelcase.mjs';
import classMemberOrder from './rules/class-member-order.mjs';
import consistentThis from './rules/consistent-this.mjs';
import effectFnName from './rules/effect-fn-name.mjs';
import effectNoImperative from './rules/effect-no-imperative.mjs';
import effectNoRun from './rules/effect-no-run.mjs';
import effectServiceId from './rules/effect-service-id.mjs';
import maxComponentProps from './rules/max-component-props.mjs';
import noUndefInit from './rules/no-undef-init.mjs';
import sharedGuards from './rules/shared-guards.mjs';

export default {
    meta: { name: 'budgie' },
    rules: {
        camelcase,
        'consistent-this': consistentThis,
        'class-member-order': classMemberOrder,
        'effect-fn-name': effectFnName,
        'effect-no-imperative': effectNoImperative,
        'effect-no-run': effectNoRun,
        'effect-service-id': effectServiceId,
        'max-component-props': maxComponentProps,
        'no-undef-init': noUndefInit,
        'shared-guards': sharedGuards
    }
};
