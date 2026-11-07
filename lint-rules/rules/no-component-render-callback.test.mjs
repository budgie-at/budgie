import { describe, it } from 'node:test';
import { RuleTester } from 'oxlint/plugins-dev';

import rule from './no-component-render-callback.mjs';

RuleTester.describe = describe;
RuleTester.it = it;

new RuleTester({ languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } } }).run('no-component-render-callback', rule, {
    valid: [
        '<List renderItem={({ item }) => <Row item={item} />} />',
        '<List renderSectionFooter={function ({ section }) { return <Footer section={section} />; }} />',
        '<List renderItem={renderItem} renderSectionFooter={callbacks.renderFooter} />',
        '<List renderItem={Foo.callbacks.renderItem} />',
        '<List ListHeaderComponent={Header} ListFooterComponent={Foo.Footer} ItemSeparatorComponent={Separator} />',
        '<List renderItem />',
        '<List renderItem="Row" />',
        '<List renderItem={null} />',
        '<List renderItem={<Row />} />',
        '<List renderItem={createRenderer()} />',
        '<List renderer:footer={Footer} />',
        '<List onPress={Button} />',
        '<List renderItem={callbacks[callbackName]} />'
    ],
    invalid: [
        '<List renderItem={Row} />',
        '<List renderSectionHeader={Header} />',
        '<List renderSectionFooter={HomeSectionFooter} />',
        '<List renderScrollComponent={ScrollView} />',
        '<List renderCustomContent={Content} />',
        '<List renderItem={Foo.Bar} />',
        '<List renderSectionFooter={Foo.Bar.Footer} />',
        '<List renderItem={components.Row} />'
    ].map(code => ({ code, errors: [{ messageId: 'componentRenderCallback' }] }))
});
