const { readFileSync } = require('node:fs');
const path = require('node:path');

module.exports = ({ types }) => ({
    visitor: {
        ImportDeclaration(declaration, state) {
            const source = declaration.node.source.value;

            if (!source.endsWith('.sql')) {
                return;
            }

            const statements = readFileSync(path.resolve(path.dirname(state.filename), source), 'utf8').split('--> statement-breakpoint');
            const [specifier] = declaration.node.specifiers;

            declaration.replaceWith(
                types.variableDeclaration('const', [
                    types.variableDeclarator(
                        types.identifier(specifier.local.name),
                        types.arrowFunctionExpression([], types.arrayExpression(statements.map(statement => types.stringLiteral(statement))))
                    )
                ])
            );
        }
    }
});
