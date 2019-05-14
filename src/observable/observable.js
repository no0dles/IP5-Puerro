/**
 * Observable Pattern Implementation
 *
 * @module observable
 */

export { Observable, ObservableObject, ObservableList };

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
    replace:   newObject       => notify(newObject),
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

/* EXPERIMENTS */
const EventManager = () => {
  const subscribers = {};
  return {
    publish:   (name, data)       => (subscribers[name] || []).forEach(subscriber => subscriber(data)),
    subscribe: (name, subscriber) => {
      subscribers[name] = subscribers[name] || [];
      subscribers[name].push(subscriber);
    },
    unsubscribe: (name, subscriber) => {
      subscribers[name] = (subscribers[name] || []).filter(s => s !== subscriber);
    },
  };
};

const Observer = callback => {
  return {
    observe: observable => observable.onChange(callback),
  };
};

const EventObservable = obj => {
  const events = { CHANGED: 0, ADDED: 1, REMOVED: 2, MADE_INVALID: 3 };
  const observers = [];
  return {
    events,
    get: () => obj,
    onChange: observer => observers.push(observer),
    changeTo: (newObj, event = events.CHANGED) => {
      if (obj === newObj) return;
      observers.forEach(notify => notify(newObj, event, obj));
      obj = newObj;
    },
  };
};

const ObservableForm = form => {
  return Object.getOwnPropertyNames(HTMLElement.prototype)
    .filter(p => p.startsWith('on'))
    .reduce((events, event) => {
      events[event] = callback => selector => {
        const elements = selector ? form.querySelectorAll(selector) : form.querySelectorAll('*');
        elements.forEach(element => element.addEventListener(event.substring(2), e => callback(e)));
      };
      return events;
    }, {});
};