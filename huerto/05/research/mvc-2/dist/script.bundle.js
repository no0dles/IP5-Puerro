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
  * Creates a new HTML Element.
  * If the attribute is a function it will add it as an EventListener.
  * Otherwise as an attribute.
  *
  * @param {string} tagName name of the tag
  * @param {object} attributes attributes or listeners to set in element
  * @param {*} innerHTML content of the tag
  *
  * @returns {HTMLElement}
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
   * Creates a node object which can be rendered
   *
   * @param {string} tagName
   * @param {object} attributes
   * @param {VNode[] | VNode | any} nodes
   *
   * @returns {VNode}
   */
  const vNode = (tagName, attributes = {}, ...nodes) => ({
    tagName,
    attributes: null == attributes ? {} : attributes,
    children: null == nodes ? [] : [].concat(...nodes), // collapse nested arrays.
  });
  const h = vNode;

  /**
   * Renders a given node object
   * Considers ELEMENT_NODE AND TEXT_NODE https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
   *
   * @param {VNode} node
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
    const $element = createDomElement(node.tagName, node.attributes);
    node.children.forEach(c => $element.appendChild(render(c)));
    return $element;
  };

   /**
    * Renders given stateful view into given container (MVC approach)
    * 
    * @param {HTMLElement} $root 
    * @param {object} model 
    * @param {function(): VNode} view 
    * @param {any} controller 
    * @param {boolean} diffing 
    */
  const mountMVC = ($root, model, view, controller, diffing = true) => {
    let vDom = view(controller(model, refresh));
    $root.prepend(render(vDom));

    function refresh(model) {
      const newVDom = view(controller(model, refresh));

      if (diffing) {
        diff($root, newVDom, vDom);
      } else {
        $root.replaceChild(render(newVDom), $root.firstChild);
      }

      vDom = newVDom;
    }
  };

  /**
   * Compares two VDOM nodes and applies the differences to the dom
   *
   * @param {HTMLElement} $parent
   * @param {VNode} oldNode
   * @param {VNode} newNode
   * @param {number} index
   */
  const diff = ($parent, newNode, oldNode, index = 0) => {
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
        diff($parent.childNodes[index], newNode, oldNode.children[i], i);
      });
    }
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

  const model = { name: '' };

  const view = controller =>
    h('div', {}, [
      h('input', { input: evt => controller.setName(evt.target.value) }),
      h('span', {}, controller.getMessage()),
    ]);

  /**
   * Observable Pattern Implementations
   *
   * @module observable
   */

  const controller = (model, refresh) => {
    return {
      getMessage: () => ` Input: ${model.name}`,
      setName: name => {
        model.name = name;
        refresh(model);
      },
    };
  };

  mountMVC(document.querySelector('#diffing'), model, view, controller);
  mountMVC(document.querySelector('#no-diffing'), model, view, controller, false);

}());
