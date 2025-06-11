# odata-builder

Generate Typesafe OData v4 Queries with Ease. odata-builder ensures your queries are correct as you write them, eliminating worries about incorrect query formats.

[![build and test](https://github.com/nbyx/odata-builder/actions/workflows/ci-cd.yml/badge.svg?branch=main)](https://github.com/nbyx/odata-builder/actions/workflows/ci-cd.yml)
[![npm version](https://badge.fury.io/js/odata-builder.svg)](https://www.npmjs.com/package/odata-builder)

## ⚠️ Breaking Changes in v0.8.0

**Important**: This version introduces breaking changes to lambda expressions and function syntax. Please review the [Migration Guide](#migration-guide) below.

## Features

- ✨ **Complete TypeScript Support** with perfect autocomplete
- 🔒 **Type-Safe Queries** - catch errors at compile time
- 📊 **Comprehensive OData v4 Support** including functions, lambda expressions, and advanced filtering
- 🚀 **Performance Optimized** with minimal runtime overhead
- 🎯 **Developer Experience** focused with extensive IntelliSense support

## Install

Install odata-builder using your preferred package manager:

```bash
npm install --save odata-builder
```

or

```bash
yarn add odata-builder
```

## Quick Start

```typescript
import { OdataQueryBuilder } from 'odata-builder';

type Product = {
    id: number;
    name: string;
    price: number;
    category: string;
    isActive: boolean;
}

const query = new OdataQueryBuilder<Product>()
    .filter({ field: 'isActive', operator: 'eq', value: true })
    .filter({ field: 'price', operator: 'gt', value: 100 })
    .orderBy({ field: 'name', orderDirection: 'asc' })
    .top(10)
    .toQuery();
// Result: ?$filter=isActive eq true and price gt 100&$orderby=name asc&$top=10
```

## Core Query Operations

### Basic Filtering

```typescript
const queryBuilder = new OdataQueryBuilder<Product>()
    .filter({ field: 'name', operator: 'eq', value: 'iPhone' })
    .filter({ field: 'price', operator: 'gt', value: 500 })
    .toQuery();
// Result: ?$filter=name eq 'iPhone' and price gt 500
```

### Count and Data Retrieval

```typescript
// Count with filters
const countQuery = new OdataQueryBuilder<Product>()
    .count()
    .filter({ field: 'isActive', operator: 'eq', value: true })
    .toQuery();
// Result: ?$count=true&$filter=isActive eq true

// Count only (no data)
const countOnlyQuery = new OdataQueryBuilder<Product>()
    .count(true)
    .filter({ field: 'category', operator: 'eq', value: 'Electronics' })
    .toQuery();
// Result: /$count?$filter=category eq 'Electronics'
```

### Selection and Ordering

```typescript
const query = new OdataQueryBuilder<Product>()
    .select('name', 'price', 'category')
    .orderBy({ field: 'price', orderDirection: 'desc' })
    .orderBy({ field: 'name', orderDirection: 'asc' })
    .top(20)
    .skip(40)
    .toQuery();
// Result: ?$select=name,price,category&$orderby=price desc,name asc&$top=20&$skip=40
```

## Advanced Filtering

### GUID Support

```typescript
import { Guid } from 'odata-builder';

type User = {
    id: Guid;
    name: string;
}

const query = new OdataQueryBuilder<User>()
    .filter({
        field: 'id',
        operator: 'eq',
        value: 'f92477a9-5761-485a-b7cd-30561e2f888b',
        removeQuotes: true  // Optional: removes quotes around GUID
    })
    .toQuery();
// Result: ?$filter=id eq f92477a9-5761-485a-b7cd-30561e2f888b
```

### Case-Insensitive Filtering

```typescript
const query = new OdataQueryBuilder<Product>()
    .filter({
        field: 'name',
        operator: 'contains',
        value: 'apple',
        ignoreCase: true
    })
    .toQuery();
// Result: ?$filter=contains(tolower(name), 'apple')
```

### Combined Filters

```typescript
const query = new OdataQueryBuilder<Product>()
    .filter({
        logic: 'and',
        filters: [
            { field: 'isActive', operator: 'eq', value: true },
            {
                logic: 'or',
                filters: [
                    { field: 'category', operator: 'eq', value: 'Electronics' },
                    { field: 'category', operator: 'eq', value: 'Books' }
                ]
            }
        ]
    })
    .toQuery();
// Result: ?$filter=(isActive eq true and (category eq 'Electronics' or category eq 'Books'))
```

## OData Functions

### String Functions

```typescript
// String length
const query = new OdataQueryBuilder<Product>()
    .filter({
        field: 'name',
        function: { type: 'length' },
        operator: 'gt',
        value: 10
    })
    .toQuery();
// Result: ?$filter=length(name) gt 10

// String concatenation
const concatQuery = new OdataQueryBuilder<Product>()
    .filter({
        field: 'name',
        function: {
            type: 'concat',
            values: [' - ', { fieldReference: 'category' }]
        },
        operator: 'eq',
        value: 'iPhone - Electronics'
    })
    .toQuery();
// Result: ?$filter=concat(name, ' - ', category) eq 'iPhone - Electronics'

// Substring extraction
const substringQuery = new OdataQueryBuilder<Product>()
    .filter({
        field: 'name',
        function: { type: 'substring', start: 0, length: 5 },
        operator: 'eq',
        value: 'iPhone'
    })
    .toQuery();
// Result: ?$filter=substring(name, 0, 5) eq 'iPhone'

// String search position
const indexQuery = new OdataQueryBuilder<Product>()
    .filter({
        field: 'name',
        function: { type: 'indexof', value: 'Pro' },
        operator: 'gt',
        value: -1
    })
    .toQuery();
// Result: ?$filter=indexof(name, 'Pro') gt -1
```

### Mathematical Functions

```typescript
// Basic arithmetic
const query = new OdataQueryBuilder<Product>()
    .filter({
        field: 'price',
        function: { type: 'add', operand: 100 },
        operator: 'gt',
        value: 1000
    })
    .toQuery();
// Result: ?$filter=price add 100 gt 1000

// Field references in arithmetic
const fieldRefQuery = new OdataQueryBuilder<Product>()
    .filter({
        field: 'price',
        function: { type: 'mul', operand: { fieldReference: 'taxRate' } },
        operator: 'lt',
        value: 500
    })
    .toQuery();
// Result: ?$filter=price mul taxRate lt 500

// Rounding functions
const roundQuery = new OdataQueryBuilder<Product>()
    .filter({
        field: 'price',
        function: { type: 'round' },
        operator: 'eq',
        value: 100
    })
    .toQuery();
// Result: ?$filter=round(price) eq 100
```

### Date/Time Functions

```typescript
type Order = {
    id: number;
    createdAt: Date;
    updatedAt: Date;
}

// Extract date parts
const yearQuery = new OdataQueryBuilder<Order>()
    .filter({
        field: 'createdAt',
        function: { type: 'year' },
        operator: 'eq',
        value: 2024
    })
    .toQuery();
// Result: ?$filter=year(createdAt) eq 2024

// Current time comparison
const nowQuery = new OdataQueryBuilder<Order>()
    .filter({
        field: 'updatedAt',
        function: { type: 'now' },
        operator: 'gt',
        value: new Date('2024-01-01')
    })
    .toQuery();
// Result: ?$filter=now() gt 2024-01-01T00:00:00.000Z

// Date extraction
const dateQuery = new OdataQueryBuilder<Order>()
    .filter({
        field: 'createdAt',
        function: { type: 'date', field: { fieldReference: 'createdAt' } },
        operator: 'eq',
        value: '2024-01-15',
        removeQuotes: true
    })
    .toQuery();
// Result: ?$filter=date(createdAt) eq 2024-01-15
```

### Direct Boolean Functions

```typescript
// Direct boolean function calls (no operator needed)
const containsQuery = new OdataQueryBuilder<Product>()
    .filter({
        field: 'name',
        function: { type: 'contains', value: 'Pro' }
    })
    .toQuery();
// Result: ?$filter=contains(name, 'Pro')

// Boolean function with explicit comparison
const notContainsQuery = new OdataQueryBuilder<Product>()
    .filter({
        field: 'name',
        function: { type: 'contains', value: 'Basic' },
        operator: 'eq',
        value: false
    })
    .toQuery();
// Result: ?$filter=contains(name, 'Basic') eq false
```

## Property Transformations

Transform field values before comparison:

```typescript
// String transformations
const query = new OdataQueryBuilder<Product>()
    .filter({
        field: 'name',
        operator: 'eq',
        value: 'iphone',
        transform: ['tolower', 'trim']
    })
    .toQuery();
// Result: ?$filter=tolower(trim(name)) eq 'iphone'

// Numeric transformations
const roundQuery = new OdataQueryBuilder<Product>()
    .filter({
        field: 'price',
        operator: 'eq',
        value: 100,
        transform: ['round']
    })
    .toQuery();
// Result: ?$filter=round(price) eq 100

// Date transformations
type Event = { startDate: Date; }
const dateQuery = new OdataQueryBuilder<Event>()
    .filter({
        field: 'startDate',
        operator: 'eq',
        value: 2024,
        transform: ['year']
    })
    .toQuery();
// Result: ?$filter=year(startDate) eq 2024
```

## Array and Lambda Expressions

### Filtering String Arrays

```typescript
type Article = {
    title: string;
    tags: string[];
}

const query = new OdataQueryBuilder<Article>()
    .filter({
        field: 'tags',
        lambdaOperator: 'any',
        expression: {
            field: '',
            operator: 'eq',
            value: 'technology'
        }
    })
    .toQuery();
// Result: ?$filter=tags/any(s: s eq 'technology')
```

### Filtering Object Arrays

```typescript
type Product = {
    name: string;
    reviews: Array<{
        rating: number;
        comment: string;
        verified: boolean;
    }>;
}

const query = new OdataQueryBuilder<Product>()
    .filter({
        field: 'reviews',
        lambdaOperator: 'any',
        expression: {
            field: 'rating',
            operator: 'gt',
            value: 4
        }
    })
    .toQuery();
// Result: ?$filter=reviews/any(s: s/rating gt 4)
```

### Functions in Lambda Expressions

```typescript
// String functions in arrays
const lengthQuery = new OdataQueryBuilder<Article>()
    .filter({
        field: 'tags',
        lambdaOperator: 'any',
        expression: {
            field: '',
            function: { type: 'length' },
            operator: 'gt',
            value: 5
        }
    })
    .toQuery();
// Result: ?$filter=tags/any(s: length(s) gt 5)

// Complex nested expressions
const complexQuery = new OdataQueryBuilder<Product>()
    .filter({
        field: 'reviews',
        lambdaOperator: 'all',
        expression: {
            field: 'comment',
            function: { type: 'tolower' },
            operator: 'contains',
            value: 'excellent'
        }
    })
    .toQuery();
// Result: ?$filter=reviews/all(s: contains(tolower(s/comment), 'excellent'))
```

### Nested Lambda Expressions

```typescript
type Category = {
    name: string;
    products: Array<{
        name: string;
        variants: Array<{
            color: string;
            size: string;
        }>;
    }>;
}

const nestedQuery = new OdataQueryBuilder<Category>()
    .filter({
        field: 'products',
        lambdaOperator: 'any',
        expression: {
            field: 'variants',
            lambdaOperator: 'any',
            expression: {
                field: 'color',
                operator: 'eq',
                value: 'red'
            }
        }
    })
    .toQuery();
// Result: ?$filter=products/any(s: s/variants/any(t: t/color eq 'red'))
```

## Full-Text Search

### Simple Search

```typescript
const query = new OdataQueryBuilder<Product>()
    .search('laptop gaming')
    .toQuery();
// Result: ?$search=laptop%20gaming
```

### Advanced Search with SearchExpressionBuilder

```typescript
import { SearchExpressionBuilder } from 'odata-builder';

const searchQuery = new OdataQueryBuilder<Product>()
    .search(
        new SearchExpressionBuilder()
            .term('laptop')
            .and()
            .phrase('high performance')
            .or()
            .group(
                new SearchExpressionBuilder()
                    .term('gaming')
                    .and()
                    .not(new SearchExpressionBuilder().term('budget'))
            )
    )
    .toQuery();
// Result: ?$search=laptop%20AND%20%22high%20performance%22%20OR%20(gaming%20AND%20(NOT%20budget))
```

### SearchExpressionBuilder Methods

```typescript
const builder = new SearchExpressionBuilder()
    .term('laptop')           // Single term: laptop
    .phrase('exact match')    // Quoted phrase: "exact match"  
    .and()                    // Logical AND
    .or()                     // Logical OR
    .not(                     // Logical NOT
        new SearchExpressionBuilder().term('budget')
    )
    .group(                   // Grouping with parentheses
        new SearchExpressionBuilder().term('gaming')
    );
```

## Property Expansion

### Basic Expansion

```typescript
type Order = {
    id: number;
    customer: {
        name: string;
        email: string;
    };
}

const query = new OdataQueryBuilder<Order>()
    .expand('customer')
    .toQuery();
// Result: ?$expand=customer
```

### Nested Property Expansion

```typescript
type Order = {
    id: number;
    customer: {
        profile: {
            address: {
                city: string;
                country: string;
            };
        };
    };
}

const query = new OdataQueryBuilder<Order>()
    .expand('customer/profile/address')  // Full autocomplete support
    .toQuery();
// Result: ?$expand=customer/profile/address
```

## Type-Safe Function Parameters

Create reusable, type-safe filter functions:

```typescript
import { FilterFields, FilterOperators } from 'odata-builder';

const createStringFilter = <T>(
    field: FilterFields<T, string>,
    operator: FilterOperators<string>,
    value: string
) => {
    return new OdataQueryBuilder<T>()
        .filter({ field, operator, value })
        .toQuery();
};

// Usage with full type safety and autocomplete
const result = createStringFilter(product, 'contains', 'iPhone');
```

## Complete Example: E-commerce Product Search

```typescript
type Product = {
    id: number;
    name: string;
    price: number;
    category: string;
    isActive: boolean;
    tags: string[];
    reviews: Array<{
        rating: number;
        comment: string;
        verified: boolean;
    }>;
    createdAt: Date;
}

const complexQuery = new OdataQueryBuilder<Product>()
    // Text search
    .search(
        new SearchExpressionBuilder()
            .term('laptop')
            .and()
            .phrase('high performance')
    )
    // Combined filters
    .filter({
        logic: 'and',
        filters: [
            // Active products only
            { field: 'isActive', operator: 'eq', value: true },
            // Price range
            { field: 'price', operator: 'ge', value: 500 },
            { field: 'price', operator: 'le', value: 2000 },
            // Has gaming tag
            {
                field: 'tags',
                lambdaOperator: 'any',
                expression: {
                    field: '',
                    operator: 'eq',
                    value: 'gaming'
                }
            },
            // Has good reviews
            {
                field: 'reviews',
                lambdaOperator: 'any',
                expression: {
                    logic: 'and',
                    filters: [
                        { field: 'rating', operator: 'gt', value: 4 },
                        { field: 'verified', operator: 'eq', value: true }
                    ]
                }
            },
            // Created this year
            {
                field: 'createdAt',
                function: { type: 'year' },
                operator: 'eq',
                value: 2024
            }
        ]
    })
    // Sorting and pagination
    .orderBy({ field: 'price', orderDirection: 'asc' })
    .orderBy({ field: 'name', orderDirection: 'asc' })
    .top(20)
    .skip(0)
    .select('name', 'price', 'category')
    .count()
    .toQuery();
```

## Supported OData v4 Features

### ✅ Fully Implemented

- **Operators**: `eq`, `ne`, `gt`, `ge`, `lt`, `le`, `contains`, `startswith`, `endswith`, `indexof`
- **String Functions**: `concat`, `contains`, `endswith`, `indexof`, `length`, `startswith`, `substring`, `tolower`, `toupper`, `trim`
- **Math Functions**: `add`, `sub`, `mul`, `div`, `mod`, `round`, `floor`, `ceiling`
- **Date Functions**: `year`, `month`, `day`, `hour`, `minute`, `second`, `now`, `date`, `time`
- **Lambda Operators**: `any`, `all` with nested support
- **Logic Operators**: `and`, `or` with grouping
- **Query Options**: `$filter`, `$select`, `$expand`, `$orderby`, `$top`, `$skip`, `$count`, `$search`
- **Advanced Features**: Field references, property transformations, case-insensitive filtering, GUID support

### Type Safety Features

- **Strict TypeScript**: Perfect autocomplete for all properties and methods
- **Compile-time Validation**: Catch errors before runtime
- **Operator Restrictions**: Only valid operators for each field type
- **Deep Object Navigation**: Full autocomplete for nested properties
- **Function Parameter Validation**: Ensures correct function usage

## Migration Guide

### Upgrading from v0.7.x to v0.8.0

Version 0.8.0 introduces breaking changes to improve type safety and add OData function support. Here's how to update your code:

#### 1. Lambda Expression Changes

**Before (v0.7.x):**
```typescript
// Old syntax with innerProperty
const query = new OdataQueryBuilder<MyType>()
    .filter({
        field: 'items',
        operator: 'contains',
        value: 'test',
        lambdaOperator: 'any',
        innerProperty: 'name',
        ignoreCase: true,
    })
    .toQuery();
```

**After (v0.8.0):**
```typescript
// New syntax with expression object
const query = new OdataQueryBuilder<MyType>()
    .filter({
        field: 'items',
        lambdaOperator: 'any',
        expression: {
            field: 'name',
            operator: 'contains',
            value: 'test',
            ignoreCase: true
        }
    })
    .toQuery();
```

#### 2. Simple Array Lambda Expressions

**Before (v0.7.x):**
```typescript
// Old syntax for simple arrays
const query = new OdataQueryBuilder<MyType>()
    .filter({
        field: 'tags',
        operator: 'contains',
        value: 'important',
        lambdaOperator: 'any',
        ignoreCase: true,
    })
    .toQuery();
```

**After (v0.8.0):**
```typescript
// New syntax - use empty string for field
const query = new OdataQueryBuilder<MyType>()
    .filter({
        field: 'tags',
        lambdaOperator: 'any',
        expression: {
            field: '',  // Empty string for array elements
            operator: 'contains',
            value: 'important',
            ignoreCase: true
        }
    })
    .toQuery();
```

#### 3. New OData Function Support

Version 0.8.0 adds comprehensive OData function support:

```typescript
// String functions
const lengthFilter = new OdataQueryBuilder<Product>()
    .filter({
        field: 'name',
        function: { type: 'length' },
        operator: 'gt',
        value: 10
    })
    .toQuery();

// Math functions  
const roundedPrice = new OdataQueryBuilder<Product>()
    .filter({
        field: 'price',
        function: { type: 'round' },
        operator: 'eq',
        value: 100
    })
    .toQuery();

// Date functions
const yearFilter = new OdataQueryBuilder<Order>()
    .filter({
        field: 'createdAt',
        function: { type: 'year' },
        operator: 'eq',
        value: 2024
    })
    .toQuery();
```

#### 4. Property Transformations (New Feature)

Transform field values before comparison:

```typescript
// String transformations
const query = new OdataQueryBuilder<Product>()
    .filter({
        field: 'name',
        operator: 'eq',
        value: 'iphone',
        transform: ['tolower', 'trim']  // Chain transformations
    })
    .toQuery();
// Result: ?$filter=tolower(trim(name)) eq 'iphone'
```

#### 5. Nested Lambda Expressions (New Feature)

```typescript
// Deep nesting support
const nestedQuery = new OdataQueryBuilder<Category>()
    .filter({
        field: 'products',
        lambdaOperator: 'any',
        expression: {
            field: 'variants',
            lambdaOperator: 'any', 
            expression: {
                field: 'color',
                operator: 'eq',
                value: 'red'
            }
        }
    })
    .toQuery();
// Result: ?$filter=products/any(s: s/variants/any(t: t/color eq 'red'))
```

#### Quick Migration Checklist

1. ✅ **Update lambda filters**: Replace `innerProperty` with `expression: { field: '...' }`
2. ✅ **Fix array lambdas**: Use `field: ''` for simple array element filtering  
3. ✅ **Test your queries**: All existing functionality should work with the new syntax
4. ✅ **Explore new features**: Consider using OData functions and property transformations

#### Need Help?

If you encounter issues during migration:
- Check the extensive examples in this README
- Review the TypeScript autocomplete suggestions
- [Open an issue](https://github.com/nbyx/odata-builder/issues) if you need assistance

## Contributing

Your contributions are welcome! If there's a feature you'd like to see in odata-builder, or if you encounter any issues, please feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License.