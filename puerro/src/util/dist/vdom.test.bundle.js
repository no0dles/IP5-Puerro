(function () {
  'use strict';

  /**
   * Creates a new HTMLElement
   * @param {string} tagName
   *
   * @returns {function(content): HTMLElement}
   */
  const createElement = (tagName, attributes = {}) => content => {
    const $element = document.createElement(tagName);
    if (content) {
      $element.innerHTML = content;
    }
    Object.keys(attributes).forEach(key => {
      if (typeof attributes[key] === 'function') {
        $element.addEventListener(key, attributes[key]);
      } else {
        $element.setAttribute(key, attributes[key]);
      }
    });
    return $element;
  };

  function Assert() {
    const ok = [];
    return {
      getOk: () => ok,
      is: (actual, expected) => {
        const result = actual === expected;
        if (!result) {
          console.log(`expected "${expected}" but was "${actual}"`);
          try {
            throw Error();
          } catch (err) {
            console.log(err);
          }
        }
        ok.push(result);
      },
      true: cond => ok.push(cond),
    };
  }

  /**
   * Reports an executed test to the DOM
   *
   * @param {string} origin
   * @param {Array<bool>} ok
   */
  function report(origin, ok) {
    const style = `
    color: ${ok.every(elem => elem) ? 'green' : 'red'};
    padding-left: 20px;
  `;
    const $report = createElement('div', { style })(`
    ${ok.filter(elem => elem).length}/${ok.length} Tests in ${origin} ok.
  `);
    document.body.appendChild($report);
  }

  /**
   * Creates group heading, to group tests together
   *
   * @param {string} name
   */
  function reportGroup(name) {
    const style = `
    font-weight: bold;
    margin-top: 10px;
  `;
    const $reportGroup = createElement('div', { style })(`Test ${name}`);
    document.body.appendChild($reportGroup);
  }

  /**
   * Adds and executes a test.
   *
   * @param {String} name
   * @param {Function} callback
   */
  function test(name, callback) {
    const assert = Assert();
    callback(assert);
    report(name, assert.getOk());
  }

  /**
   * Adds a testGroup to the test report
   *
   * @param {String} name
   * @param {Function} callback
   */
  function describe(name, callback) {
    reportGroup(name);
    return callback(test);
  }

  const vNode = tag => (attributes = {}) => (...nodes) => ({
    tag,
    attributes,
    children: [].concat(...nodes), // collapse nested arrays.
  });

  const createNode = vNode => {
    if (typeof vNode === 'string' || typeof vNode === 'number') {
      return document.createTextNode(vNode);
    }

    let $node = document.createElement(vNode.tag);
    Object.keys(vNode.attributes).forEach(a =>
      $node.setAttribute(a, vNode.attributes[a])
    );

    vNode.children.forEach(c => $node.appendChild(createNode(c))); // append child nodes

    return $node;
  };

  // Attempt to generate vElements.. but export doesn't work as expected
  const tags = ['input', 'form', 'button'];
  const vElements = tags.reduce((acc, tag) => {
    acc[tag] = vNode(tag);
    return acc;
  }, {});

  describe('vdom util', test => {
    test('createElement with plain text', assert => {
      // given
      const tagName = 'div';
      const content = 'test123';

      // when
      const $el = createNode(vNode(tagName)()(content));

      // then
      assert.is($el.innerText, content);
      assert.is($el.tagName.toLowerCase(), tagName);
    });

    test('createElement with child nodes', assert => {
      // given
      const tagName = 'ul';
      const content = [vNode('li')()('test'), vNode('li')()('123')];

      // when
      const $el = createNode(vNode(tagName)()(content));

      //  then
      assert.is($el.childElementCount, 2);
    });

    test('createElement with attribute', assert => {
      // given
      const tagName = 'p';
      const content = 'test';
      const attributes = { style: 'color: green' };

      // when
      const $el = createNode(vNode(tagName)(attributes)(content));

      // then
      assert.is($el.getAttribute('style'), 'color: green');
    });
  });

}());