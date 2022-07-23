import { OrderByDescriptor } from 'src/query-builder/types/orderby/orderby-descriptor.type';

export const toOrderByQuery = <T>(orderBy: OrderByDescriptor<T>[]) => {
    const orderByFields = orderBy.reduce(
        (prev, curr, index, array) =>
            prev +
            `${curr.field} ${curr.orderDirection}${
                index < array.length - 1 ? ', ' : ''
            }`,
        '',
    );

    return `$orderby=${orderByFields}`;
};
