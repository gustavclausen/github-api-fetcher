import { AbstractPagedRequest, GraphQLFragment, GraphQLObjectField } from './utils';

describe('AbstractPagedRequest', (): void => {
    class StubClass extends AbstractPagedRequest<object> {
        fragment: GraphQLFragment = new GraphQLFragment('name', 'demo', []);
        query: string = '';
    }

    describe('parseResponse', (): void => {
        let stub: StubClass;

        beforeEach((): StubClass => (stub = new StubClass({})));

        it('should update page-info', (): void => {
            const response = {
                pageInfo: {
                    hasNextPage: true,
                    nextElement: 'element-123'
                }
            };

            stub.parseResponse(response);

            expect(stub.pageInfo).toMatchObject(response.pageInfo);
        });

        it('should update variables for next request', (): void => {
            const response = {
                pageInfo: {
                    hasNextPage: true,
                    nextElement: '123-element'
                }
            };

            stub.parseResponse(response);

            expect(stub.variables).toMatchObject({
                after: response.pageInfo.nextElement
            });
        });
    });
});

describe('GraphQLFragment', (): void => {
    describe('toString', (): void => {
        const onObjectName = 'GraphQLObject';
        const whitespaceRegex = /\s/g;

        it('should return correct string representation of simple fragment with no aliases', (): void => {
            const fragment = new GraphQLFragment('Simple', onObjectName, [
                new GraphQLObjectField('name'),
                new GraphQLObjectField('birthdate')
            ]);

            const expected = `
                fragment ${fragment.name} on ${onObjectName} {
                    name
                    birthdate
                }
            `;

            expect(fragment.toString().replace(whitespaceRegex, '')).toEqual(expected.replace(whitespaceRegex, ''));
        });

        it('should return correct string representation of simple fragment with aliases', (): void => {
            const fragment = new GraphQLFragment('Simple', onObjectName, [
                new GraphQLObjectField('name', 'nameAlias'),
                new GraphQLObjectField('birthdate', 'birthdateAlias')
            ]);

            const expected = `
                fragment ${fragment.name} on ${onObjectName} {
                    nameAlias: name
                    birthdateAlias: birthdate
                }
            `;

            expect(fragment.toString().replace(whitespaceRegex, '')).toEqual(expected.replace(whitespaceRegex, ''));
        });

        it('should return correct string representation of fragment with nested properties', (): void => {
            const fragment = new GraphQLFragment('Simple', onObjectName, [
                new GraphQLObjectField('persons', null, [
                    new GraphQLObjectField('name'),
                    new GraphQLObjectField('childs', null, [new GraphQLObjectField('age')])
                ]),
                new GraphQLObjectField('city')
            ]);

            const expected = `
                fragment ${fragment.name} on ${onObjectName} {
                    persons {
                        name
                        childs {
                            age
                        }
                    }
                    city
                }
            `;

            expect(fragment.toString().replace(whitespaceRegex, '')).toEqual(expected.replace(whitespaceRegex, ''));
        });

        it('should return correct string representation of fragment with nested properties with aliases', (): void => {
            const fragment = new GraphQLFragment('Simple', onObjectName, [
                new GraphQLObjectField('persons', 'familyMembers', [
                    new GraphQLObjectField('name'),
                    new GraphQLObjectField('childs', 'siblings', [new GraphQLObjectField('age')])
                ])
            ]);

            const expected = `
                fragment ${fragment.name} on ${onObjectName} {
                    familyMembers: persons {
                        name
                        siblings: childs {
                            age
                        }
                    }
                }
            `;

            expect(fragment.toString().replace(whitespaceRegex, '')).toEqual(expected.replace(whitespaceRegex, ''));
        });
    });
});
