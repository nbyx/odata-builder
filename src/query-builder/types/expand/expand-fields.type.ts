export type ExpandFields<T> = {
    [K in Extract<keyof T, string>]-?: T[K] extends Record<string, unknown>
        ? {
              [TK in Extract<keyof T[K], string>]-?: T[K][TK] extends Record<
                  string,
                  unknown
              >
                  ? `${K}/${TK}` | K
                  : K;
          }[Extract<keyof T[K], string>]
        : never;
}[Extract<keyof T, string>];
