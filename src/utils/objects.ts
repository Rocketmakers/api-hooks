export namespace Objects {
  /**
   * Simple object check.
   * @param item
   * @returns {boolean}
   */
  // eslint-disable-next-line @typescript-eslint/ban-types
  export function isObject(item: any): item is object {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  /**
   * A basic deep clone for objects
   * - WARNING: object must be OK to go through `JSON.stringify`
   * @param object The object to clone
   * @returns The cloned object
   */
  export function deepClone<TObject>(object: TObject): TObject {
    return JSON.parse(JSON.stringify(object));
  }
  /**
   * Deep merge two objects.
   * @param target The target object to merge into
   * @param sources The new source objects
   */
  export function mergeDeep<TObject>(target: TObject, ...sources: Partial<TObject>[]) {
    if (!isObject(target)) {
      return target;
    }
    const newTarget = { ...target };
    for (const source of sources) {
      if (isObject(source)) {
        Object.keys(source).forEach((key) => {
          const targetValue = newTarget[key];
          const sourceValue = source[key];
          if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
            newTarget[key] = [...targetValue, ...sourceValue];
          } else if (isObject(targetValue) && isObject(sourceValue)) {
            newTarget[key] = mergeDeep(targetValue, sourceValue);
          } else {
            newTarget[key] = sourceValue;
          }
        });
      }
    }

    return newTarget;
  }
}
