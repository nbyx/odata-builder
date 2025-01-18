export type ExpandFields<T, Depth extends number = 5> = [Depth] extends [never]
    ? never
    : {
          [K in Extract<keyof T, string>]: NonNullable<T[K]> extends Record<
              string,
              unknown
          >
              ? K | `${K}/${ExpandFields<NonNullable<T[K]>, PrevDepth<Depth>>}`
              : never;
      }[Extract<keyof T, string>];

type PrevDepth<T extends number> = [
    never, // 0
    0, // 1
    1, // 2
    2, // 3
    3, // 4
    4, // 5
][T];
