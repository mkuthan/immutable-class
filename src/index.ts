/**
 * Interface that the Immutable Class class should extend (types the instance)
 */
export interface Instance<ValueType, JSType> {
  valueOf(): ValueType
  toJS(): JSType
  toJSON(): JSType
  equals(other: Instance<ValueType, JSType>): boolean
}

/**
 * Interface that the Immutable Class class should conform to (types the class)
 */
export interface Class<ValueType, JSType> {
  fromJS(properties: JSType): Instance<ValueType, JSType>
  new (properties: ValueType): any
}

/**
 * Checks to see if thing is an instance of the given constructor.
 * Works just like the native instanceof method but handles the case when
 * objects are coming from different frames or from different modules.
 * @param thing - the thing to test
 * @param constructor - the constructor class to check against
 * @returns {boolean}
 */
export function isInstanceOf(thing: any, constructor: any): boolean {
  if (typeof constructor !== 'function') throw new TypeError("constructor must be a function");
  if (thing instanceof constructor) return true;
  if (thing == null) return false;
  var constructorName: string = constructor.name;
  if (!constructorName) return false;
  var thingProto: any = thing.__proto__;
  while (thingProto && thingProto.constructor) {
    if (thingProto.constructor.name === constructorName) return true;
    thingProto = thingProto.__proto__;
  }
  return false;
}

/**
 * Check to see if things are an array of instances of the given constructor
 * Uses isInstanceOf internally
 * @param things - the array of things to test
 * @param constructor - the constructor class to check against
 * @returns {boolean}
 */
export function isArrayOf(things: any[], constructor: any): boolean {
  if (!Array.isArray(things)) return false;
  for (var i = 0, length = things.length; i < length; i++) {
    if (!isInstanceOf(things[i], constructor)) return false;
  }
  return true;
}

/**
 * Does a quick 'duck typing' test to see if the given parameter is an immutable class
 * @param thing - the thing to test
 * @returns {boolean}
 */
export function isImmutableClass(thing: any): boolean {
  if (!thing || typeof thing !== 'object') return false;
  var ClassFn = thing.constructor;
  return typeof ClassFn.fromJS === 'function' && // Has Class.fromJS
         typeof thing.toJS === 'function' && // Has Class#toJS
         typeof thing.equals === 'function'; // Has Class#equals
}

export interface Equalable {
  equals(other: any): boolean;
}

/**
 * Checks if two arrays have equal immutable classes
 * @param arrayA - array to compare
 * @param arrayB - array to compare
 * @returns {boolean}
 */
export function arraysEqual<T extends Equalable>(arrayA: T[], arrayB: T[]): boolean {
  var length = arrayA.length;
  if (length !== arrayB.length) return false;
  for (var i = 0; i < length; i++) {
    var vA: Equalable = arrayA[i];
    if (!(vA && typeof vA.equals === 'function' && vA.equals(arrayB[i]))) return false;
  }
  return true;
}

/**
 * Checks if two lookups have equal immutable classes
 * @param lookupA - lookup to compare
 * @param lookupB - lookup to compare
 * @returns {boolean}
 */
export function lookupsEqual(lookupA: { [k: string]: Equalable }, lookupB: { [k: string]: Equalable }): boolean {
  var keysA = Object.keys(lookupA);
  var keysB = Object.keys(lookupB);
  if (keysA.length !== keysB.length) return false;
  for (var k of keysA) {
    var vA: Equalable = lookupA[k];
    if (!(vA && typeof vA.equals === 'function' && vA.equals(lookupB[k]))) return false;
  }
  return true;
}
