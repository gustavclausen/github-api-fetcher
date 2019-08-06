import GetGistProfileRequest from './profile';
import { GraphQLRequest } from '../../utils';
import { GistProfile } from '../../../../models';
import { RequestError, ResponseErrorType } from '../../../../lib/errors';

describe('GetGistProfileRequest', (): void => {
    let request: GraphQLRequest<GistProfile>;

    beforeEach((): void => {
        request = new GetGistProfileRequest('dummy-user', 'dummy-gist-id');
    });

    describe('parseResponse', (): void => {
        it('should throw RequestError of NOT_FOUND type when returned data is null', (): void => {
            const response = {
                user: {
                    gist: null
                }
            };

            try {
                request.parseResponse(response);
                throw new Error(`Test didn't throw error`);
            } catch (error) {
                const requestError = error as RequestError;

                expect(requestError.type).toBe(ResponseErrorType.NOT_FOUND);
            }
        });
    });
});
