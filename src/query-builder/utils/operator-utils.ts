import { OrderByDescriptor } from '../types/orderby-descriptor.type';

export const toSelectQuery = (select: string[]) => `$select=${select.join(', ')}`;

export const toOrderByQuery = <T>(orderBy: OrderByDescriptor<T>[]) => {
    const orderByFields = orderBy.reduce((prev, curr, index, array) => 
        prev + `${curr.field} ${curr.orderDirection}${index < array.length -1 ? ', ' : ''}`
    , '');

    return `$orderby=${orderByFields}`;
}
