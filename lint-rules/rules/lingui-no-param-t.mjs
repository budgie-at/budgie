const TRANSLATOR = 't';

const FUNCTION_TYPES = new Set(['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression']);

const getParamName = param => (param.type === 'AssignmentPattern' ? param.left.name : param.name);

const declaresInBody = (fn, name) =>
    fn.body.type === 'BlockStatement' &&
    fn.body.body.some(
        statement =>
            statement.type === 'VariableDeclaration' &&
            statement.declarations.some(
                declarator =>
                    (declarator.id.type === 'Identifier' && declarator.id.name === name) ||
                    (declarator.id.type === 'ObjectPattern' &&
                        declarator.id.properties.some(property => property.value?.type === 'Identifier' && property.value.name === name))
            )
    );

export default {
    meta: {
        type: 'problem',
        docs: { description: 'Disallow Lingui tagged templates on a translator received as a function parameter; the macro never extracts them.' },
        schema: [],
        messages: {
            paramTag:
                't`…` on a parameter is not transformed by the Lingui macro, so the string is never extracted and renders empty. Use t(msg`…`) or call t`…` where useLingui() is destructured.'
        }
    },
    create(context) {
        return {
            TaggedTemplateExpression(node) {
                if (node.tag.type !== 'Identifier' || node.tag.name !== TRANSLATOR) {
                    return;
                }

                for (let ancestor = node.parent; ancestor; ancestor = ancestor.parent) {
                    if (!FUNCTION_TYPES.has(ancestor.type)) {
                        continue;
                    }

                    if (ancestor.params.some(param => getParamName(param) === TRANSLATOR)) {
                        context.report({ node, messageId: 'paramTag' });

                        return;
                    }

                    if (declaresInBody(ancestor, TRANSLATOR)) {
                        return;
                    }
                }
            }
        };
    }
};
