export type Guid = string & { _type: Guid };
export interface GuidFilter {
    value: Guid;
    removeQuotes?: boolean;
}
