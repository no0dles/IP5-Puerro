import { render, diff } from '../vdom/vdom';
import { render as preactRender } from 'preact';
import { ObservableObject } from '../observable/observable';

export { Controller, PreactController };

const store = ObservableObject({});

class Controller {
  constructor($root, state, view, diffing = true) {
    this.$root = $root;
    this.state = ObservableObject({ ...state });
    this.view = view;
    this.diffing = diffing;
    this.vDom = null;
    this.init();
    this.onInit();
  }

  init() {
    this.vDom = this.view(this);
    this.$root.prepend(render(this.vDom));
    this.store.onChange(s => this.refresh());
    this.state.onChange(s => this.refresh());
  }

  onInit() {}

  refresh() {
    const newVDom = this.view(this);
    this.repaint(newVDom);
    this.vDom = newVDom;
  }

  repaint(newVDom) {
    if (this.diffing) {
      diff(this.$root, newVDom, this.vDom);
    } else {
      this.$root.replaceChild(render(newVDom), this.$root.firstChild);
    }
  }

  get model() {
    return { ...store.get(), ...this.state.get() };
  }

         get store() { return store; }
  static get store() { return store; }
}

class PreactController extends Controller {
  init() {
    this.store.onChange(s => this.refresh());
    this.state.onChange(s => this.refresh());
  }

  repaint(newVdom) {
    preactRender(newVdom, this.$root, this.$root.firstChild);
  }
}