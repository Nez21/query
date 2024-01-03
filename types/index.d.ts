type Constructor<T = any> = new (...args: any[]) => T

type AnyObject = Record<string, any>

type AnyFunction = (...args: any[]) => any

type Maybe<T> = T | null | undefined

type Ref<T> = T

type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T
