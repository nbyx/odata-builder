# odata-builder

Generate Typesafe OData Queries with Ease. odata-builder ensures your queries are correct as you write them, eliminating worries about incorrect query formats.

[![build and test](https://github.com/nbyx/odata-builder/actions/workflows/ci-cd.yml/badge.svg?branch=main)](https://github.com/nbyx/odata-builder/actions/workflows/ci-cd.yml)
[![npm version](https://badge.fury.io/js/odata-builder.svg)](https://www.npmjs.com/package/odata-builder)

## Install

Install odata-builder using your preferred package manager:

```javascript
npm install --save odata-builder
```

or

```javascript
yarn add odata-builder
```

## Usage

Effortlessly create queries with typesafe objects:

```javascript
const item = {
    someProperty: 'someValue',
}

const queryBuilder = new OdataQueryBuilder<typeof item>()
    .count()
    .filter({field: 'someProperty', operator: 'eq', value: 'test'})
    .skip(10)
    .top(100)
    .select('someOtherProperty1', 'someOtherProperty2')
    .toQuery();
//  ^ ?$count=true&$filter=someProperty eq 'test'&$skip=10&$top=100&$select=someOtherProperty1, someOtherProperty2
```

### Count and Data Retrieval

For counting and data retrieval:

```javascript
const queryBuilder = new OdataQueryBuilder<MyAwesomeDto>()
    .count(true)
    .filter(...) // only for demonstrating the count
    .toQuery();
//  ^ /$count?$filter=....
```

### Querying with GUID:

Decide on the inclusion of single quotes in GUID queries:

```javascript
import { Guid, OdataQueryBuilder } from 'odata-builder';

// You could type your id directly as guid
type MyAwesomeDto = {
    id: Guid;
    ...
}

const filter = {
    field: 'id',
    operator: 'eq'
    value: 'f92477a9-5761-485a-b7cd-30561e2f888b', // must be guid
    removeQuotes: true, // if not defined the guid will be added to the query with single quotes
}

const queryBuilder = new OdataQueryBuilder<MyAwesomeDto>()
    .filter(filter)
    .toQuery();
//  ^ ?$filter=id eq some-guid

```

### Lambda Expressions for Array Filtering:

Utilize lambda expressions for filtering array fields:

```javascript
type MyAwesomeDto = {
    ...
    someProperty: string[]
    ...
}

const queryBuilder = new OdataQueryBuilder<MyAwesomeDto>()
    .filter({
        field: 'someProperty',
        operator: 'contains',
        value: 'test',
        lambdaOperator: 'any',
        ignoreCase: true,
    })
    .toQuery();
//  ^ ?$filter=someProperty/any(s: contains(tolower(s), 'test'));
```

### Filtering Objects in Arrays:

Filter within arrays of objects:

```javascript
type MyAwesomeDto = {
    ...
    someProperty: { someInnerProperty: string }[]
    ...
}

const queryBuilder = new OdataQueryBuilder<MyAwesomeDto>()
    .filter({
        field: 'someProperty',
        operator: 'contains',
        value: 'test',
        lambdaOperator: 'any',
        innerProperty: 'someInnerProperty', // <-- you will also get autocomplete for this property
        ignoreCase: true,
    })
    .toQuery();
//  ^ ?$filter=someProperty/any(s: contains(tolower(s/someInnerProperty), 'test'));

```

### Combined Filters:

Combine multiple filters:

```javascript
 const queryBuilder = new ODataQueryBuilder<MyAwesomeDto>
    .filter({
        logic: 'or',
        filters: [
            { field: 'x', operator: 'eq', value: 'test' },
            { field: 'y', operator: 'eq', value: 5 },
        ],
    })
    .toQuery();
//  ^ ?$filter=(x eq test or y eq 5)
```

### Full-Text Search Queries:

Full-text search allows you to query textual data efficiently. Use the `search` method for global text searches across multiple fields or for advanced logical search expressions.

#### Simple Search:

You can use a raw string for basic search functionality:

```javascript
const queryBuilder = new OdataQueryBuilder<MyAwesomeDto>()
    .search('simple search term')
    .toQuery();
//  ^ ?$search=simple%20search%20term
```

#### Advanced Search with SearchExpressionBuilder:

For more complex search requirements, use the SearchExpressionBuilder to construct logical expressions.

```javascript
import { SearchExpressionBuilder } from 'odata-builder';

const queryBuilder = new OdataQueryBuilder<MyAwesomeDto>()
    .search(
        new SearchExpressionBuilder()
            .term('red')
            .and()
            .term('blue')
            .or()
            .group(
                new SearchExpressionBuilder()
                    .term('green')
                    .not(new SearchExpressionBuilder().term('yellow')),
            ),
    )
    .toQuery();
//  ^ ?$search=(red%20AND%20blue%20OR%20(green%20AND%20(NOT%20yellow)))
```

#### Combining Search with Other Parameters:

`search` can be combined seamlessly with other query parameters:

```javascript
const queryBuilder = new OdataQueryBuilder<MyAwesomeDto>()
    .filter({ field: 'isActive', operator: 'eq', value: true })
    .orderBy({ field: 'name', orderDirection: 'asc' })
    .top(20)
    .search(
        new SearchExpressionBuilder()
            .term('keyword')
            .and()
            .phrase('exact phrase'),
    )
    .toQuery();
//  ^ ?$filter=isActive eq true&$orderby=name asc&$top=20&$search=keyword%20AND%20%22exact%20phrase%22
```

### SearchExpressionBuilder Methods

The `SearchExpressionBuilder` provides methods to build logical search expressions. Here's an overview of its core methods:

#### **1. `term`**
Adds a single search term to the expression.

- **Example**:
    ```javascript
    new SearchExpressionBuilder().term('keyword');
    // ^ keyword
    ```

- **Behavior**: A single word without quotes.

#### **2. `phrase`**
Adds a phrase (multiple words) as a single search entity, enclosed in quotes.

- **Example**:
    ```javascript
    new SearchExpressionBuilder().phrase('exact match');
    // ^ "exact match"
    ```

- **Behavior**: Ensures the entire phrase is treated as a single unit.

#### **3. `and` / `or`**
Adds logical operators to combine multiple terms or phrases.

- **Example**:
    ```javascript
    new SearchExpressionBuilder().term('red').and().term('blue');
    // ^ red AND blue
    ```

#### **4. `not`**
Negates a search expression.

- **Example**:
    ```javascript
    new SearchExpressionBuilder().not(new SearchExpressionBuilder().term('red'));
    // ^ NOT red
    ```

#### **5. `group`**
Groups a search expression to control logical precedence.

- **Example**:
    ```javascript
    new SearchExpressionBuilder().group(
        new SearchExpressionBuilder().term('red').or().term('blue')
    );
    // ^ (red OR blue)
    ```

---

### `build` vs `toString`

#### **`build`**
- Returns the raw structure of the search expression as an array of parts.
- Useful for debugging or extending the search logic programmatically.

- **Example**:
    ```javascript
    const builder = new SearchExpressionBuilder().term('red').and().term('blue');
    console.log(builder.build());
    // ^ [ 'red', 'AND', 'blue' ]
    ```

#### **`toString`**
- Converts the search expression into a properly formatted query string.
- Used when appending the search to an OData query.

- **Example**:
    ```javascript
    const builder = new SearchExpressionBuilder().term('red').and().term('blue');
    console.log(builder.toString());
    // ^ red AND blue
    ```

#### Why Use SearchExpressionBuilder?

The SearchExpressionBuilder provides:

- **Logical Operators**: Combine search terms using `AND`, `OR`, and `NOT`.
- **Grouping**: Use nested expressions for advanced search logic.
- **Type Safety**: Get compile-time validation for all search expressions.

### Function Encapsulation:

Encapsulate query creation:

```javascript
const item = {
    x: 4,
    y: 'test',
    z: new Date(Date.now()),
};

const testFn = (
    field: FilterFields<typeof item, string>, // you can use that type to get only the fields with type string
    operator: FilterOperators<string>, // only allows filter operators for the given type
    value: string, // you should use the type that you have defined in the FilterFields type
): string => {
    const queryBuilder = new OdataQueryBuilder<typeof item>();

    queryBuilder.filter({ field, operator, value });

    return queryBuilder.toQuery();
};

const result = testFn('y', 'eq', 'test');
//  ^ ?$filter=y eq 'test'
```

### Property Expansion:

Expand properties in queries:

```javascript
const item = {
    x: { someProperty: '' },
}
const queryBuilder = new OdataQueryBuilder<typeof item>();
    .expand('x')
    .toQuery();
//  ^ ?expand=x
```

You can do this with inner properties as well:

```javascript
const item = {
    x: { someProperty: { nestedProperty: '' } },
}
const queryBuilder = new OdataQueryBuilder<typeof item>();
    .expand('x/someProperty') // you will get autocomplete for these properties
    .toQuery();
//  ^ ?expand=x/someProperty
```

# Features

- Generate oData4 queries with typesafe objects.
    - Check of field, value and possible operator for a filter
    - Orderby, Select only fields of your model
    - **Autocomplete** for every property in your filter, orderby, etc...
    - Filtering of arrays in your model
    - Filters can be added with strings that will get typechecked
- Generate Queries to manipluate data (soon™)

# ToDos

- [x] Add **select** query
- [x] Add **orderby** with order direction asc or desc
- [x] Add single **filter** support with lambda expressions
- [x] Add expand support
- [ ] Add odata function support (partially done)
- [x] Add search support
- [ ] Add support for data modification queries with odata

Your contributions are welcome! If there's a feature you'd like to see in odata-builder, or if you encounter any issues, please feel free to open an issue or submit a pull request.
