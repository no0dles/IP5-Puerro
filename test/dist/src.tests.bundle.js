(function () {
  'use strict';

  (function () {

    /**
     * A Module that abstracts Virtual DOM interactions.
     * It's purpose is to perform actions on DOM-like Objects
     *
     * @module vdom
     */

    /**
     * Creates a new HTML Element.
     * If the attribute is a function it will add it as an EventListener.
     * Otherwise as an attribute.
     *
     * @param {string} tagName name of the tag
     * @param {object} attributes attributes or listeners to set in element
     * @param {*} innerHTML content of the tag
     *
     * @returns {function(content): HTMLElement}
     */
    const createDomElement = (tagName, attributes = {}, innerHTML = '') => {
      const $element = document.createElement(tagName);
      $element.innerHTML = innerHTML;
      Object.keys(attributes)
        .filter(key => null != attributes[key]) // don't create attributes with value null/undefined
        .forEach(key => {
          if (typeof attributes[key] === 'function') {
            $element.addEventListener(key, attributes[key]);
          } else {
            $element.setAttribute(key, attributes[key]);
          }
        });
      return $element;
    };

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


    function Assert() {
      const ok = [];

      const assert = (actual, expected, result)=> {
        if (!result) {
          console.log(`expected "${expected}" but was "${actual}"`);
          try {
            throw Error();
          } catch (err) {
            console.log(err);
          }
        }
        ok.push(result);
      };

      return {
        getOk: () => ok,
        is: (actual, expected) => assert(actual, expected, actual === expected),
        objectIs: (actual, expected) =>
          assert(actual, expected,
            Object.entries(actual).toString() === Object.entries(expected).toString()
          ),
        true: cond => ok.push(cond),
      };
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
      const $reportGroup = createDomElement('div', { style }, `Test ${name}`);
      document.body.appendChild($reportGroup);
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
      const $report = createDomElement('div', { style },`
    ${ok.filter(elem => elem).length}/${ok.length} Tests in ${origin} ok.
  `);
      document.body.appendChild($report);
    }

    /**
     * Observable Pattern Implementation
     *
     * @module observable
     */

    const Observable = item => {
      const listeners = [];
      return {
        get: () => item,
        set: newItem => {
          if (item === newItem) return;
          const oldItem = item;
          item = newItem;
          listeners.forEach(notify => notify(newItem, oldItem));
        },
        onChange: callback => {
          listeners.push(callback);
          callback(item, item);
        },
      };
    };

    const ObservableObject = object => {
      const listeners   = [];
      const subscribers = {};

      const notify = newObject => {
        if (object == newObject) return;
        const oldObject = object;
        object = newObject;

        Object.keys(newObject).forEach(key => {
          const newValue = newObject[key];
          const oldValue = oldObject[key];
          if (oldValue === newValue) return;
          (subscribers[key] || []).forEach(subscriber => subscriber(newValue, oldValue));
        });
        listeners.forEach(listener => listener(newObject, oldObject));
      };

      return {
        get:       ()              => object,
        set:       newObject       => notify({ ...object, ...newObject }),
        push:      (key, value)    => notify({ ...object, ...{ [key]: value } }),
        remove:    key             => notify({ ...object, ...{ [key]: undefined } }),
        replace:   newObject       => {
          const emptyObject = Object.assign({}, object);
          Object.keys(emptyObject).forEach(key => emptyObject[key] = undefined);
          notify({ ...emptyObject, ...newObject});
        },
        onChange:  callback        => { listeners.push(callback); callback(object, object); },
        subscribe: (key, callback) => {
          subscribers[key] = subscribers[key] || [];
          subscribers[key].push(callback);
          callback(object[key], object[key]);
        },
        // unsubscribe, removeOnChange
      };
    };

    /**
     *
     * @param {any[]} list
     */
    const ObservableList = list => {
      const addListeners     = [];
      const removeListeners  = [];
      const replaceListeners = [];
      return {
        onAdd:     listener => addListeners    .push(listener),
        onRemove:  listener => removeListeners .push(listener),
        onReplace: listener => replaceListeners.push(listener),
        add: item => {
          list.push(item);
          addListeners.forEach(listener => listener(item));
        },
        remove: item => {
          const i = list.indexOf(item);
          if (i >= 0) {
            list.splice(i, 1);
          } // essentially "remove(item)"
          removeListeners.forEach(listener => listener(item));
        },
        replace: (item, newItem) => {
          const i = list.indexOf(item);
          if (i >= 0) {
            list[i] = newItem;
          }
          replaceListeners.forEach(listener => listener(newItem, item));
        },
        count:   ()    => list.length,
        countIf: pred  => list.reduce((sum, item) => (pred(item) ? sum + 1 : sum), 0),
        indexOf: item  => list.indexOf(item),
        get:     index => list[index],
        getAll:  ()    => list,
      };
    };

    describe('Observables', test => {
      test('Observable Value', assert => {
        // given
        const observable1 = Observable('');
        const observable2 = Observable('');

        let newValue1, oldValue1, newValue2, oldValue2;
        observable1.onChange((newVal, oldVal) => { newValue1 = newVal; oldValue1 = oldVal; });
        observable2.onChange((newVal, oldVal) => { newValue2 = newVal; oldValue2 = oldVal; });
        
        // initial state
        assert.is(observable1.get(), '');

        // when  
        observable1.set('Puerro');

        // then 
        assert.is(newValue1,         'Puerro'); // subscribers got notified  
        assert.is(oldValue1,         '');       // subscribers got notified  
        assert.is(observable1.get(), 'Puerro'); // value has updated

        // when the receiver symbol changes
        const newRef = observable1;
        newRef.set('Huerto');

        // then listener still updates correctly
        assert.is(newValue1,         'Huerto'); // subscribers got notified  
        assert.is(oldValue1,         'Puerro'); // subscribers got notified  
        assert.is(observable1.get(), 'Huerto'); // value has updated

        // when
        observable2.set('Puerro');

        // then subscribers get notified
        assert.is(newValue1,         'Huerto');
        assert.is(newValue2,         'Puerro');
        assert.is(oldValue1,         'Puerro');
        assert.is(oldValue2,         '');
        assert.is(observable2.get(), 'Puerro'); //  value is updated
      });

      test('Observable List', assert => {
        // given
        const raw = [];
        const list = ObservableList(raw); // decorator pattern

        let addCount = 0, removeCount = 0;
        list.onAdd   (item => (addCount    += item));
        list.onRemove(item => (removeCount += item));

        // initial
        assert.is(list.count(), 0);
        assert.is(raw.length,   0);

        // when
        list.add(1);

        // then
        const index = list.indexOf(1);
        assert.is(addCount,        1);
        assert.is(list.count(),    1);
        assert.is(raw.length,      1);
        assert.is(index,           0);
        assert.is(list.get(index), 1);

        // when
        list.remove(1);

        // then
        assert.is(removeCount,  1);
        assert.is(list.count(), 0);
        assert.is(raw.length,   0);
      });

      test('Observable Object', assert => {
        // given
        const object = ObservableObject({}); // decorator pattern

        let newObject, oldObject, newValue, oldValue;
        object.onChange (         (newObj, oldObj) => { newObject = newObj; oldObject = oldObj; });
        object.subscribe('value', (newVal, oldVal) => { newValue  = newVal; oldValue  = oldVal; });
        
        // initial
        assert.objectIs(object.get(), {});
        assert.objectIs(oldObject,    {});
        assert.objectIs(newObject,    {});
        assert.is      (oldValue,     undefined);
        assert.is      (newValue,     undefined);

        // when
        object.set({ value: 1 });

        // then
        assert.objectIs(oldObject,    {});
        assert.objectIs(newObject,    { value: 1 });
        assert.is      (oldValue,     undefined);
        assert.is      (newValue,     1);

        // when
        object.push('text', 'Puerro');

        // then
        assert.objectIs(oldObject,    { value: 1 });
        assert.objectIs(newObject,    { value: 1, text: 'Puerro' });
        assert.is      (oldValue,     undefined);
        assert.is      (newValue,     1);

        // when
        object.replace({ text: 'Huerto' });

        // then
        assert.objectIs(oldObject,    { value: 1,         text: 'Puerro' });
        assert.objectIs(newObject,    { value: undefined, text: 'Huerto' });
        assert.is      (oldValue,     1);
        assert.is      (newValue,     undefined);

        // when
        object.set({ value: 2 });

        // then
        assert.objectIs(oldObject,    { value: undefined, text: 'Huerto' });
        assert.objectIs(newObject,    { value: 2,         text: 'Huerto' });
        assert.is      (oldValue,     undefined);
        assert.is      (newValue,     2);

        // when
        object.set({ value: 1 });

        // then
        assert.objectIs(oldObject,    { value: 2, text: 'Huerto' });
        assert.objectIs(newObject,    { value: 1, text: 'Huerto' });
        assert.is      (oldValue,     2);
        assert.is      (newValue,     1);

        // when
        object.remove('value');

        // then
        assert.objectIs(object.get(), newObject);
        assert.objectIs(oldObject,    { value: 1,         text: 'Huerto' });
        assert.objectIs(newObject,    { value: undefined, text: 'Huerto' });
        assert.is      (oldValue,     1);
        assert.is      (newValue,     undefined);
      });
    });

  }());

  (function () {

    /**
     * A Module that abstracts Virtual DOM interactions.
     * It's purpose is to perform actions on DOM-like Objects
     *
     * @module vdom
     */

    /**
     * Creates a new HTML Element.
     * If the attribute is a function it will add it as an EventListener.
     * Otherwise as an attribute.
     *
     * @param {string} tagName name of the tag
     * @param {object} attributes attributes or listeners to set in element
     * @param {*} innerHTML content of the tag
     *
     * @returns {function(content): HTMLElement}
     */
    const createDomElement = (tagName, attributes = {}, innerHTML = '') => {
      const $element = document.createElement(tagName);
      $element.innerHTML = innerHTML;
      Object.keys(attributes)
        .filter(key => null != attributes[key]) // don't create attributes with value null/undefined
        .forEach(key => {
          if (typeof attributes[key] === 'function') {
            $element.addEventListener(key, attributes[key]);
          } else {
            $element.setAttribute(key, attributes[key]);
          }
        });
      return $element;
    };

    /**
     * compares two VDOM nodes and returns true if they are different
     *
     * @param {VNode} node1
     * @param {VNode} node2
     */
    const changed = (node1, node2) => {
      const nodeChanged =
        typeof node1 !== typeof node2 ||
        ((typeof node1 === 'string' || typeof node1 === 'number') && node1 !== node2) ||
        node1.type !== node2.type;
      const attributesChanged =
        !!node1.attributes &&
        !!node2.attributes &&
        (Object.keys(node1.attributes).length !== Object.keys(node2.attributes).length ||
          Object.keys(node1.attributes).some(
            a =>
              node1.attributes[a] !== node2.attributes[a] &&
              (null == node1.attributes[a] ? '' : node1.attributes[a]).toString() !==
                (null == node2.attributes[a] ? '' : node2.attributes[a]).toString()
          ));
      return nodeChanged || attributesChanged;
    };

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


    function Assert() {
      const ok = [];

      const assert = (actual, expected, result)=> {
        if (!result) {
          console.log(`expected "${expected}" but was "${actual}"`);
          try {
            throw Error();
          } catch (err) {
            console.log(err);
          }
        }
        ok.push(result);
      };

      return {
        getOk: () => ok,
        is: (actual, expected) => assert(actual, expected, actual === expected),
        objectIs: (actual, expected) =>
          assert(actual, expected,
            Object.entries(actual).toString() === Object.entries(expected).toString()
          ),
        true: cond => ok.push(cond),
      };
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
      const $reportGroup = createDomElement('div', { style }, `Test ${name}`);
      document.body.appendChild($reportGroup);
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
      const $report = createDomElement('div', { style },`
    ${ok.filter(elem => elem).length}/${ok.length} Tests in ${origin} ok.
  `);
      document.body.appendChild($report);
    }

    describe('vdom', test => {

      test('createDomElement with plain text', assert => {
        // given
        const tagName = 'div';
        const content = 'test123';

        // when
        const $el = createDomElement(tagName, {}, content);

        // then
        assert.is($el.innerText, content);
        assert.is($el.tagName.toLowerCase(), tagName);
      });

      test('createDomElement with child nodes', assert => {
        // given
        const tagName = 'ul';
        const content = `
      <li>test</li>
      <li>123</li>
    `;

        // when
        const $el = createDomElement(tagName, {}, content);

        //  then
        assert.is($el.childElementCount, 2);
      });

      test('createDomElement with attribute', assert => {
        // given
        const tagName = 'p';
        const content = 'test';
        const attributes = { style: 'color: green' };

        // when
        const $el = createDomElement(tagName, attributes, content);

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

  }());

  // Generated file

}());
