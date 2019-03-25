import { describe } from '../test/test';
import { createElement, changed } from './dom';

describe('dom util', test => {
  test('createElement with plain text', assert => {
    // given
    const tagName = 'div';
    const content = 'test123';

    // when
    const $el = createElement(tagName)(content);

    // then
    assert.is($el.innerText, content);
    assert.is($el.tagName.toLowerCase(), tagName);
  });

  test('createElement with child nodes', assert => {
    // given
    const tagName = 'ul';
    const content = `
      <li>test</li>
      <li>123</li>
    `;

    // when
    const $el = createElement(tagName)(content);

    //  then
    assert.is($el.childElementCount, 2);
  });

  test('createElement with attribute', assert => {
    // given
    const tagName = 'p';
    const content = 'test';
    const attributes = { style: 'color: green' };

    // when
    const $el = createElement(tagName, attributes)(content);

    // then
    assert.is($el.getAttribute('style'), 'color: green');
  });

  test('nodeChanged', assert => {
    // given
    let node1 = 1,
      node2 = 1;

    // when
    let result = changed(node1, node2);

    // then
    assert.is(result, false);

    // when
    node2 = 2;
    result = changed(node1, node2);

    // then
    assert.is(result, true);

    // when
    node2 = { tagName: 'p' };
    result = changed(node1, node2);

    // then
    assert.is(result, true);

    // when
    node1 = { tagName: 'p' };
    result = changed(node1, node2);

    // then
    assert.is(result, false);
  });

  test('attributesChanged', assert => {
    // given
    let node1 = { attributes: { test: 1 } };
    let node2 = { attributes: { test: 1 } };

    // when
    let result = changed(node1, node2);

    // then
    assert.is(result, false);

    // when
    node2.attributes.test = 2;
    result = changed(node1, node2);

    // then
    assert.is(result, true);

    // when
    delete node2.attributes.test;
    result = changed(node1, node2);

    // then
    assert.is(result, true);
  });
});
