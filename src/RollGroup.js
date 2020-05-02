import ComparePoint from './ComparePoint';
import ExplodeModifier from './modifiers/ExplodeModifier';
import Modifier from './modifiers/Modifier';
import ReRollModifier from './modifiers/ReRollModifier';
import RequiredArgumentError from './exceptions/RequiredArgumentErrorError';

const modifiersSymbol = Symbol('modifiers');
const notationSymbol = Symbol('notation');
const expressionsSymbol = Symbol('expressions');

class RollGroup {
  /**
   *
   * @param {string} notation
   * @param {StandardDice[]} expressions
   * @param {Map|{}|Map[]|null=} modifiers
   */
  constructor(notation, expressions, modifiers = null) {
    if (!notation) {
      throw new RequiredArgumentError('notation');
    }

    this[notationSymbol] = notation;
    this.expressions = expressions || [];

    if (modifiers) {
      this.modifiers = modifiers;
    }
  }

  /**
   * The expressions in this group
   *
   * @returns {[]}
   */
  get expressions() {
    return [...(this[expressionsSymbol] || [])];
  }

  /**
   * Sets the expressions
   *
   * @param {[]} expressions
   */
  set expressions(expressions) {
    if (!expressions) {
      throw new RequiredArgumentError('expressions is required');
    }

    if (!Array.isArray(expressions)) {
      throw new TypeError(`expressions must be an array: ${expressions}`);
    }

    if (expressions.length === 0) {
      throw new TypeError(`expressions cannot be empty: ${expressions}`);
    }

    expressions.forEach((e) => {
      if (!e || !Array.isArray(e)) {
        throw new TypeError(`expressions must be an array of arrays: ${expressions}`);
      }

      if (e.length === 0) {
        throw new TypeError(`Sub expressions cannot be empty: ${expressions}`);
      }
    });

    // loop through each expression and add it to the list
    this[expressionsSymbol] = [];
    expressions.forEach((expression) => {
      this.addExpression(expression);
    });
  }

  /**
   * The modifiers that affect this group
   *
   * @returns {Map|null}
   */
  get modifiers() {
    if (this[modifiersSymbol]) {
      // ensure modifiers are ordered correctly
      return new Map([...this[modifiersSymbol]].sort((a, b) => a[1].order - b[1].order));
    }

    return null;
  }

  /**
   * Sets the modifiers that affect this group
   *
   * @param value
   */
  set modifiers(value) {
    let modifiers;
    if (value instanceof Map) {
      modifiers = value;
    } else if (Array.isArray(value)) {
      // loop through and get the modifier name of each item and use it as the map key
      modifiers = new Map(value.map((modifier) => [modifier.name, modifier]));
    } else if (typeof value === 'object') {
      modifiers = new Map(Object.entries(value));
    } else {
      throw new TypeError('modifiers should be a Map, an Array, or an Object');
    }

    if (
      modifiers.size
      && [...modifiers.entries()].some((entry) => !(entry[1] instanceof Modifier))
    ) {
      throw new TypeError('modifiers must only contain Modifier instances');
    }

    this[modifiersSymbol] = modifiers;

    // loop through each modifier and ensure that those that require it have compare points
    // @todo find a better way of defining compare point on modifiers that don't have them
    this[modifiersSymbol].forEach((modifier) => {
      /* eslint-disable no-param-reassign */
      if ((modifier instanceof ExplodeModifier) && !modifier.comparePoint) {
        modifier.comparePoint = new ComparePoint('=', this.max);
      } else if ((modifier instanceof ReRollModifier) && !modifier.comparePoint) {
        modifier.comparePoint = new ComparePoint('=', this.min);
      }
    });
  }

  /**
   * The dice notation for this group
   *
   * @returns {string}
   */
  get notation() {
    return this[notationSymbol];
  }

  addExpression(value) {
    this[expressionsSymbol].push(value);
  }

  /**
   * Returns an object for JSON serialising
   *
   * @returns {{}}
   */
  toJSON() {
    const { modifiers, notation, expressions } = this;

    return {
      expressions,
      modifiers,
      notation,
      type: 'group',
    };
  }

  toString() {
    return this.notation;
  }
}

export default RollGroup;
