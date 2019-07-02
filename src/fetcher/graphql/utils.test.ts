import { AbstractPagedRequest, GraphQLFragment, GraphQLObjectField } from './utils';

describe('AbstractPagedRequest', (): void => {
    class StubPagedRequest extends AbstractPagedRequest<object> {
        fragment: GraphQLFragment = new GraphQLFragment('name', 'demo', []);
        query: string = '';
    }

    describe('parseResponse', (): void => {
        let pagedRequest: StubPagedRequest;

        beforeEach((): StubPagedRequest => (pagedRequest = new StubPagedRequest({})));

        it('should update page-info', (): void => {
            const response = {
                pageInfo: {
                    hasNextPage: true,
                    nextElement: 'element-123'
                }
            };

            pagedRequest.parseResponse(response);

            expect(pagedRequest.pageInfo).toMatchObject(response.pageInfo);
        });

        it('should update variables for next request', (): void => {
            const response = {
                pageInfo: {
                    hasNextPage: true,
                    nextElement: '123-element'
                }
            };

            pagedRequest.parseResponse(response);

            expect(pagedRequest.variables).toMatchObject({
                after: response.pageInfo.nextElement
            });
        });
    });
});

describe('GraphQLFragment', (): void => {
    describe('toString', (): void => {
        const onObjectName = 'GraphQLObject';

        let fragment: GraphQLFragment;
        let expectedStringPresentation: string;

        const validateFragment = (): void => {
            const whitespaceRegex = /\s/g;

            expect(fragment.toString().replace(whitespaceRegex, '')).toEqual(
                expectedStringPresentation.replace(whitespaceRegex, '')
            );
        };

        it('should return correct string representation of simple fragment with no aliases', (): void => {
            fragment = new GraphQLFragment('Simple', onObjectName, [
                new GraphQLObjectField('name'),
                new GraphQLObjectField('birthdate')
            ]);
            expectedStringPresentation = `
                fragment ${fragment.name} on ${onObjectName} {
                    name
                    birthdate
                }
            `;
            validateFragment();
        });

        it('should return correct string representation of simple fragment with aliases', (): void => {
            fragment = new GraphQLFragment('Simple', onObjectName, [
                new GraphQLObjectField('name', 'nameAlias'),
                new GraphQLObjectField('birthdate', 'birthdateAlias')
            ]);
            expectedStringPresentation = `
                fragment ${fragment.name} on ${onObjectName} {
                    nameAlias: name
                    birthdateAlias: birthdate
                }
            `;
            validateFragment();
        });

        it('should return correct string representation of fragment with nested properties', (): void => {
            fragment = new GraphQLFragment('Simple', onObjectName, [
                new GraphQLObjectField('persons', null, [
                    new GraphQLObjectField('name'),
                    new GraphQLObjectField('childs', null, [new GraphQLObjectField('age')])
                ]),
                new GraphQLObjectField('city')
            ]);
            expectedStringPresentation = `
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
            validateFragment();
        });

        it('should return correct string representation of fragment with nested properties and argument', (): void => {
            fragment = new GraphQLFragment('Simple', onObjectName, [
                new GraphQLObjectField('persons', null, [new GraphQLObjectField('name')], 'last: last-element')
            ]);
            expectedStringPresentation = `
                fragment ${fragment.name} on ${onObjectName} {
                    persons(last: last-element) {
                        name
                    }
                }
            `;
            validateFragment();
        });

        // TODO: Define arguments syntactically instead of raw string, such that nested properties and argument can be binded together
        it('should return correct string representation of fragment with argument excluded when applied on non-nested property', (): void => {
            fragment = new GraphQLFragment('Simple', onObjectName, [
                new GraphQLObjectField('name', null, null, 'first: first-element')
            ]);
            expectedStringPresentation = `
                fragment ${fragment.name} on ${onObjectName} {
                    name
                }
            `; // I.e. not expect 'name(first: first-element)'
            validateFragment();
        });

        it('should return correct string representation of fragment with nested properties with aliases', (): void => {
            fragment = new GraphQLFragment('Simple', onObjectName, [
                new GraphQLObjectField('persons', 'familyMembers', [
                    new GraphQLObjectField('childs', 'siblings', [new GraphQLObjectField('age')])
                ])
            ]);
            expectedStringPresentation = `
                fragment ${fragment.name} on ${onObjectName} {
                    familyMembers: persons {
                        siblings: childs {
                            age
                        }
                    }
                }
            `;
            validateFragment();
        });

        it('should return correct string representation of fragment with nested properties with aliases and argument', (): void => {
            fragment = new GraphQLFragment('Simple', onObjectName, [
                new GraphQLObjectField('persons', 'familyMembers', [new GraphQLObjectField('name')], 'first: 100')
            ]);
            expectedStringPresentation = `
                fragment ${fragment.name} on ${onObjectName} {
                    familyMembers: persons(first: 100) {
                        name
                    }
                }
            `;
            validateFragment();
        });
    });
});
