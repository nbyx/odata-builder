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
# Features
* Generate oData4 queries with typesafe objects.
    * Check of field, value and possible operator for a filter
    * Orderby, Select only fields of your model
    * Filters can be added with strings that will get typechecked
* Generate Queries to manipluate data (soon™)
# ToDos
- [x] Add select query
- [x] Add orderby with order direction asc or desc
- [x] Add single filter support with
- [ ] Add string filter support with typechecking (in progress)
- [ ] Add expand support
- [ ] Add odata function support (number, Date, string) (partially done)
- [ ] Add search support
- [ ] Add support for data modification queries with odata 

Any feature missing here? Please open an issue and add your feature request.
