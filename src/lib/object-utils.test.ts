import { getValueForFirstKey } from './object-utils';

describe('getValueForFirstKey', (): void => {
    it('should return null when given empty object', (): void => {
        expect(getValueForFirstKey({}, 'nonExistingKey')).toBeNull();
    });

    it('should return value for nested key in given object', (): void => {
        const obj = {
            firstKey: {
                secondKey: {
                    thirdKey: 'valueToFind'
                }
            }
        };
        const keyToFind = 'thirdKey';

        expect(getValueForFirstKey(obj, keyToFind)).toBe(obj.firstKey.secondKey.thirdKey);
    });

    it('should return null when key does not exist in given object', (): void => {
        const obj = {
            existingKey: {
                nestedKey: 'existingValue'
            }
        };
        const keyToFind = 'notToBeFound';

        expect(getValueForFirstKey(obj, keyToFind)).toBeNull();
    });

    describe('type of properties', (): void => {
        it('should return object when property value for key is a object', (): void => {
            const obj = {
                myObject: {
                    nestedKey: 'nestedValue'
                }
            };
            const keyToFind = 'myObject';

            expect(getValueForFirstKey(obj, keyToFind)).toBe(obj.myObject);
        });

        it('should return boolean when property value for key is a boolean', (): void => {
            const obj = {
                testBoolean: true
            };
            const keyToFind = 'testBoolean';

            expect(getValueForFirstKey(obj, keyToFind)).toBe(obj.testBoolean);
        });

        it('should return number when property value for key is a number', (): void => {
            const obj = {
                testNumber: 12
            };
            const keyToFind = 'testNumber';

            expect(getValueForFirstKey(obj, keyToFind)).toBe(obj.testNumber);
        });

        it('should return string when property value for key is a string', (): void => {
            const obj = {
                testString: 'testing'
            };
            const keyToFind = 'testString';

            expect(getValueForFirstKey(obj, keyToFind)).toBe(obj.testString);
        });
    });

    describe('levels of properties', (): void => {
        it('should return value for key in first level of given object', (): void => {
            const obj = {
                firstKey: {
                    dupKey: 'valueNotToFind'
                },
                dupKey: 'valueToFind'
            };
            const keyToFind = 'dupKey';

            expect(getValueForFirstKey(obj, keyToFind)).toBe(obj.dupKey);
        });

        it('should return value for key in first level of given object independent of the order of properties', (): void => {
            const obj = {
                dupKey: 'valueToFind',
                secondKey: {
                    dupKey: 'valueNotToFind'
                }
            };
            const keyToFind = 'dupKey';

            expect(getValueForFirstKey(obj, keyToFind)).toBe(obj.dupKey);
        });
    });
});
