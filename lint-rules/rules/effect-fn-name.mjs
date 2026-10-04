import { getContextServiceCall } from '../get-context-service-call.mjs';

const isEffectFnFactory = node =>
    node.type === 'CallExpression' &&
    node.callee.type === 'MemberExpression' &&
    node.callee.object.type === 'Identifier' &&
    node.callee.object.name === 'Effect' &&
    node.callee.property.name === 'fn' &&
    node.arguments[0]?.type === 'Literal' &&
    typeof node.arguments[0].value === 'string';

const getHolderName = node => {
    const { parent } = node;

    if (parent.type === 'Property' && parent.value === node && !parent.computed) {
        return parent.key.name ?? parent.key.value;
    }

    if (parent.type === 'VariableDeclarator' && parent.init === node && parent.id.type === 'Identifier') {
        return parent.id.name;
    }

    return null;
};

const findServiceClassName = node => {
    for (let ancestor = node.parent; ancestor; ancestor = ancestor.parent) {
        if ((ancestor.type === 'ClassDeclaration' || ancestor.type === 'ClassExpression') && getContextServiceCall(ancestor) !== null) {
            return ancestor.id?.name ?? null;
        }
    }

    return null;
};

export default {
    meta: {
        type: 'suggestion',
        docs: { description: "Require Effect.fn span names inside a Context.Service to be '<ClassName>.<member>'." },
        schema: [],
        messages: { wrongName: "Effect.fn name '{{name}}' must be '{{expected}}'." }
    },
    create(context) {
        return {
            CallExpression(node) {
                if (!isEffectFnFactory(node.callee)) {
                    return;
                }

                const holderName = getHolderName(node);
                const className = holderName === null ? null : findServiceClassName(node);

                if (className === null) {
                    return;
                }

                const nameNode = node.callee.arguments[0];
                const expected = `${className}.${holderName}`;

                if (nameNode.value !== expected) {
                    context.report({ node: nameNode, messageId: 'wrongName', data: { name: nameNode.value, expected } });
                }
            }
        };
    }
};
