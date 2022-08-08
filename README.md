# odata-builder
Generating odata queries typesafe. No more worries about wrong queries. Know that the query is correct while writing it.

[![Build / Test](https://github.com/nbyx/odata-builder/actions/workflows/build-and-test.yml/badge.svg)](https://github.com/nbyx/odata-builder/actions/workflows/build-and-test.yml)

## Install
To install the package use your favourite package mananger, e.g.:

```javascript
npm install --save odata-builder
```
or
```javascript
yarn add odata-builder
```
## Usage
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
If you want to count and only receive the amount of data:

```javascript
const queryBuilder = new OdataQueryBuilder<MyAwesomeDto>()
    .count(true)
    .filter(...) // only for demonstrating the count
    .toQuery();
//  ^ /$count?$filter=....
```

You can also decide if you want to have single quotes when querying with **guid**

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

If there is an array in your item, you can use lambda expressions in oData to filter for them:

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

There is also autocomplete for every property of the filter.

If the inner array ist an array of objects you need to provide the inner field for the filter:

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

If you want to choose the filter logic or you need to filter for two depended fields there is the **CombinedFilter**:

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
You could combine it with multiple Combined filters or even with the single QueryFilter.

If you want to add a function to your codebase that encapsulates the query creation you can do it like this:

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
If you need to expand a property you can use the expand function:

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
* Generate oData4 queries with typesafe objects.
    * Check of field, value and possible operator for a filter
    * Orderby, Select only fields of your model
    * **Autocomplete** for every property in your filter, orderby, etc...
    * Filtering of arrays in your model
    * Filters can be added with strings that will get typechecked
* Generate Queries to manipluate data (soon™)
# ToDos
- [x] Add **select** query
- [x] Add **orderby** with order direction asc or desc
- [x] Add single **filter** support with lambda expressions
- [ ] Add string filter support with typechecking (in progress)
- [x] Add expand support
- [ ] Add odata function support (number, Date, string) (partially done)
- [ ] Add search support
- [ ] Add support for data modification queries with odata 

Any feature missing here? Please open an issue and add your feature request.
