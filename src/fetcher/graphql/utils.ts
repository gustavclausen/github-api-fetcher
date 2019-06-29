import { getValueForFirstKey } from '../../lib/object-utils';

export class GraphQLObjectField {
    fieldValue!: string;
    aliasName?: string | null;
    nestedProperties?: GraphQLObjectField[];

    constructor(fieldValue: string, aliasName?: string | null, nestedProperties?: GraphQLObjectField[]) {
        this.fieldValue = fieldValue;
        this.aliasName = aliasName;
        this.nestedProperties = nestedProperties;
    }
}

export class GraphQLFragment {
    private _graphQLObjectName!: string; // Name of GraphQL object to make fragment on
    private _fields!: GraphQLObjectField[]; // List of fields on GraphQL object to include in fragment
    private _name!: string;

    get name(): string {
        return this._name;
    }
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

            if (curValue.nestedProperties) {
                result += `{ ${curValue.nestedProperties.reduce(reducer, '')} \n}`;
            }

            return result;
        };

        return `fragment ${this._name} on ${this._graphQLObjectName} { ${this._fields.reduce(reducer, '')} \n}`;
    }
}

export interface GraphQLRequest<TResult> {
    fragment: GraphQLFragment;
    query: string;
    variables: object | undefined;
    parseResponse(rawData: object): TResult;
}

export interface PagedGraphQLRequest<TResult> extends GraphQLRequest<TResult[]> {
    hasNextPage(): boolean;
}

export abstract class AbstractPagedRequest<T> implements PagedGraphQLRequest<T> {
    abstract fragment: GraphQLFragment;
    abstract query: string;
    pageInfo: PageInfo | undefined;
    variables: object | undefined;

    constructor(variables: object) {
        this.variables = variables;
    }

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
     * Updates page-info with data from response object, and returns empty result set (should be
     * handled by derived class).
     * @param rawData Full response object
     */
    parseResponse(rawData: object): T[] {
        const pageInfo = getValueForFirstKey(rawData, 'pageInfo') as PageInfo;
        if (pageInfo) {
            this.pageInfo = pageInfo;
            this.prepareNextPage();
        }

        return [];
    }
}

export interface PageInfo {
    hasNextPage: boolean;
    nextElement: string | null;
}
