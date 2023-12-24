type Constructor<T = any> = new (...args: any[]) => T

type IsInclude<T extends string | number | symbol, U extends string | number | symbol> = [
   T,
] extends [never]
   ? true
   : { [K in T]: K extends U ? IsInclude<Exclude<T, K>, U> : never }[T]

type Maybe<T> = T | null | undefined

type ValueOf<T> = T[keyof T]

type Ref<T> = T

type DeepPartial<T> = T extends object
   ? {
        [P in keyof T]?: DeepPartial<T[P]>
     }
   : T

type ValueOfMap<T> = T extends Map<any, infer I> ? I : never
