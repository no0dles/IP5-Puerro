(function () {
  'use strict';

  /**
   * A Module that abstracts Virtual DOM interactions.
   * It's purpose is to perform actions on DOM-like Objects
   *
   * @module vdom
   */
  /**
   * @typedef {{ tagName: string, attributes: object, children: any  }} VNode
   */

  /**
   * Creates a node object which can be rendered
   *
   * @param {string} tagName
   * @param {object} attributes
   * @param {VNode[] | VNode | any} node
   *
   * @returns {VNode}
   */
  const vNode = (tagName, attributes = {}, ...nodes) => ({
    tagName,
    attributes: null == attributes ? {} : attributes,
    children: null == nodes ? [] : [].concat(...nodes), // collapse nested arrays.
  });

  /**
   * Converts a DOM Node to a Virtual Node
   *
   * @param {HTMLElement} $node
   *
   * @returns {VNode}
   */
  const toVNode = $node => {
    const tagName = $node.tagName;
    const $children = $node.children;

    const attributes = Object.values($node.attributes).reduce((attributes, attribute) => {
      attributes[attribute.name] = attribute.value;
      return attributes;
    }, {});

    if ($children.length > 0) {
      return vNode(tagName, attributes, Array.from($children).map(toVNode));
    }

    return vNode(tagName, attributes, $node.textContent);
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
   * A Module that abstracts DOM interactions.
   * It's purpose is to perform actions on the DOM like creating and mounting elements
   *
   * @module dom
   */

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
    Object.keys(attributes)
      .filter(key => null != attributes[key]) // don't render attributes with value null/undefined
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
   * renders a given node object
   *
   * @param {import('./vdom').VNode} node
   *
   * @returns {HTMLElement}
   */
  const render = node => {
    if (null == node) {
      return document.createTextNode('');
    }
    if (typeof node === 'string' || typeof node === 'number') {
      return document.createTextNode(node);
    }
    const $element = createElement(node.tagName, node.attributes)('');
    node.children.forEach(c => $element.appendChild(render(c)));
    return $element;
  };

  /**
   * compares two VDOM nodes and applies the differences to the dom
   *
   * @param {HTMLElement} $parent
   * @param {import('./vdom').VNode} oldNode
   * @param {import('./vdom').VNode} newNode
   * @param {number} index
   */
  const diff = ($parent, oldNode, newNode, index = 0) => {
    if (null == oldNode) {
      $parent.appendChild(render(newNode));
      return;
    }
    if (null == newNode) {
      $parent.removeChild($parent.childNodes[index]);
      return;
    }
    if (changed(oldNode, newNode)) {
      $parent.replaceChild(render(newNode), $parent.childNodes[index]);
      return;
    }
    if (newNode.tagName) {
      newNode.children.forEach((newNode, i) => {
        diff($parent.childNodes[index], oldNode.children[i], newNode, i);
      });
    }
  };

  /**
   * renders given stateful view into given container
   *
   * @param {HTMLElement} $root
   * @param {function(): import('./vdom').VNode} view
   * @param {object} initialState
   * @param {boolean} useDiffing
   */
  const mount = ($root, view, initialState, useDiffing = true) => {
    let _state = initialState;

    const setState = newState => {
      _state = { ..._state, ...newState };
      const newVDom = view(viewParams);
      if (useDiffing) {
        diff($root, vDom, newVDom);
      } else {
        $root.replaceChild(render(newVDom), $root.firstChild);
      }
      vDom = newVDom;
    };

    const viewParams = {
      get state() {
        return _state;
      },
      setState: setState,
    };
    let vDom = view(viewParams);
    if ($root.firstChild) {
      $root.replaceChild(render(vDom), $root.firstChild);
    } else {
      $root.appendChild(render(vDom));
    }
  };

  const vegetableClassifications = [
    'Bulbs',
    'Flowers',
    'Fruits',
    'Fungi',
    'Leaves',
    'Roots',
    'Seeds',
    'Stems',
    'Tubers',
  ];

  /**
   * Renders the vegetable classifications
   * @param {HTMLSelectElement} $select
   */
  const renderVegetableClassifications = $select => {
    vegetableClassifications
      .map(classification => createElement('option', { value: classification })(classification))
      .forEach($select.appendChild.bind($select));
  };

  const initialState = {
    data: {
      name: 'Tomato',
      origin: 'Fungi',
    },

    methods: {},
  };

  const huertoForm = vNode => state => {
    vNode.children[2].attributes.value = state.state.data.name;
    return vNode;
  };

  const init = () => {
    const $main = document.querySelector('main');

    // TODO: There must be a better way..
    const $template = document.querySelector('#form-template');
    const $form = $template.content.querySelector('form');

    renderVegetableClassifications($form.classification);

    const form = toVNode($form);

    mount($main, huertoForm(form), initialState);
  };

  init();

}());