export default {
    meta: {
        type: 'problem',
        docs: { description: 'Disallow Lingui t`…` on a translator received as a parameter; the macro never extracts it.' },
        schema: [],
        messages: { paramTag: 't`…` on a parameter is never extracted by the Lingui macro. Use t(msg`…`).' }
    },
    create(context) {
        return {
            'TaggedTemplateExpression[tag.name="t"]'(node) {
                for (let ancestor = node.parent; ancestor; ancestor = ancestor.parent) {
                    if (ancestor.params?.some(param => param.name === 't')) {
                        context.report({ node, messageId: 'paramTag' });

                        return;
                    }
                }
            }
        };
    }
};
