(function () {
  'use strict';

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
   * Constructor function to create the Huerto UI
   *
   * @param {HTMLFormElement} $form   - Input element to add new vegetables
   * @param {HTMLElement} $vegetables - Container for the vegetables
   */
  const initHuerto = ($form, $vegetables) => {
    $form        .addEventListener('submit', onFormSubmit($vegetables));
    $form.planted.addEventListener('change', onPlantedChecked($form.amount));

    renderVegetableClassifications($form.classification);
  };

  /**
   * Event handler for subbmiting the form.
   * It appends the Vegetable Output String to the given list.
   *
   * @param {HTMLUListElement} $list
   * @returns {function(Event): void}
   */
  const onFormSubmit = $list => event => {
    event.preventDefault(); // Prevent Form Submission
    $list.appendChild(createDomElement('li', {}, createVegetableOutputString(event.target)));
  };

  /**
   * Event Handler for the amount input.
   * It changes the display style based on the planted checkbox
   *
   * @param {HTMLInputElement} $amount
   * @returns {function(Event): void}
   */
  const onPlantedChecked = $amount => event => {
    $amount.style.display = event.target.checked ? 'inline' : 'none';
  };

  /**
   * Renders the Vegetable Classifications
   *
   * @param {HTMLSelectElement} $select
   */
  const renderVegetableClassifications = $select => {
    vegetableClassifications.forEach(c => $select.append(createDomElement('option', {}, c)));
  };

  /**
   * Creates the vegetable output string
   *
   * @param {HTMLFormElement} $form
   */
  const createVegetableOutputString = $form =>
    `${$form.name.value} (${$form.classification.value}) from ${$form.origin.value}, ${
    $form.planted.checked ? `planted (${$form.amount.value})` : 'not planted'
  }, ${$form.comments.value}`;

  initHuerto(
    document.querySelector('form'), 
    document.getElementById('vegetables')
  );

}());
