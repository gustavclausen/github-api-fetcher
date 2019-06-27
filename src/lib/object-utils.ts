import _ from 'lodash';

/**
 * Deep searches object for key and returns its value if it exist. Null is returned if it does not exist.
 * The search is done in levels of properties, i.e. the first occurrence of the key is prioritized over
 * the same key in a nested object.
 * @param obj Object to find key in
 * @param keyToFind Name of key to find
 */
export function getValueForFirstKey(obj: object, keyToFind: string): object | number | boolean | string | null {
    // Key exists in current "level" of object
    if (obj.hasOwnProperty(keyToFind)) {
        return _.get(obj, keyToFind);
    }

    // Search for key in nested objects
    const objectKeys = _.keys(obj);
    for (var i = 0; i < objectKeys.length; i++) {
        // Nested property object found
        if (typeof _.get(obj, objectKeys[i]) === 'object') {
            var nestedResult = getValueForFirstKey(_.get(obj, objectKeys[i]), keyToFind); // Recursive search in nested object
            // Key exists in nested object
            if (nestedResult != null) {
                return nestedResult;
            }
        }
    }

    return null;
}
