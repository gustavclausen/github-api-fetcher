import { getValueForFirstKey } from '../../lib/object-utils';

/**
 * Defines a field on a GraphQL object, used in queries.
 * See: https://graphql.org/learn/queries/#fields
 */
export class GraphQLObjectField {
    fieldValue!: string;
    aliasName?: string | null;
    nestedProperties?: GraphQLObjectField[] | null;
    argument?: string | null;

    constructor(
        fieldValue: string,
        aliasName?: string | null,
        nestedProperties?: GraphQLObjectField[] | null,
        argument?: string | null
    ) {
        this.fieldValue = fieldValue;
        this.aliasName = aliasName;
        this.nestedProperties = nestedProperties;
        this.argument = argument;
    }
}

/**
 * Defines a GraphQL fragment, used in queries.
 * See: https://graphql.org/learn/queries/#fragments
 */
export class GraphQLFragment {
    /**
     * Name of GraphQL object to make fragment on
     */
    private _graphQLObjectName!: string;
    /**
     * List of fields on GraphQL object to include in fragment
     */
    private _fields!: GraphQLObjectField[];
    /**
     * The fragment's custom name
     */
    private _name!: string;

    /**
     * Returns the fragment's custom name
     */
    get name(): string {
        return this._name;
    }

    /**
     * Returns the fragment's fields
     */
    get fields(): GraphQLObjectField[] {
        return this._fields;
    }

    constructor(name: string, graphQLObjectName: string, fields: GraphQLObjectField[]) {
        this._name = name;
        this._graphQLObjectName = graphQLObjectName;
        this._fields = fields;
    }

    /**
     * Returns string representation of fragment to include in query
     */
    toString(): string {
        const reducer = (acc: string, curValue: GraphQLObjectField): string => {
            let result = `${acc}\n${
                curValue.aliasName ? `${curValue.aliasName}: ${curValue.fieldValue}` : `${curValue.fieldValue}`
            }`;

            if (curValue.nestedProperties && curValue.argument) {
                result += `(${curValue.argument})`;
            }

            if (curValue.nestedProperties) {
                result += `{ ${curValue.nestedProperties.reduce(reducer, '')} \n}`;
            }

            return result;
        };

        return `fragment ${this._name} on ${this._graphQLObjectName} { ${this._fields.reduce(reducer, '')} \n}`;
    }
}

/**
 * Presents the GraphQL request to be sent to the endpoint.
 * Responsible for defining the request, and parsing the response.
 *
 * @typeparam TResult Response data type
 */
export interface GraphQLRequest<TResult> {
    query: string;
    variables: object | undefined;
    parseResponse(rawData: object): TResult;
}

/**
 * Describes page info of result set returned from endpoint
 */
export interface PageInfo {
    hasNextPage: boolean;
    nextElement: string | null;
}

/**
 * Presents a paged, stateful GraphQL request to be sent to the endpoint.
 * Responsible for defining the requests, updating the page state, and parsing the responses.
 *
 * @typeparam TResult Response data type
 */
export abstract class GraphQLPagedRequest<TResult> implements GraphQLRequest<TResult[]> {
    abstract query: string;
    pageInfo: PageInfo | undefined;
    variables: object;

    constructor(variables: object) {
        this.variables = variables;
    }

    /**
     * Returns true if result set has a next page
     */
    hasNextPage(): boolean {
        return this.pageInfo ? this.pageInfo.hasNextPage : false;
    }

    private prepareNextPage(): void {
        if (!this.pageInfo) {
            throw new Error('No page info set');
        }

        this.variables = {
            ...this.variables,
            after: this.pageInfo.nextElement
        };
    }

    /**
     * Updates page-info with data from response object, and returns empty result set.
     * Parse of data must be handled by derived class.
     *
     * @param rawData Full response object
     */
    parseResponse(rawData: object): TResult[] {
        const pageInfo = getValueForFirstKey(rawData, 'pageInfo') as PageInfo;
        if (pageInfo) {
            this.pageInfo = pageInfo;
            this.prepareNextPage();
        }

        return [];
    }
}
