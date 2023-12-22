import { BadRequestException } from '@nestjs/common'

const toString = (el: any) => {
   switch (typeof el) {
      case 'function':
         return (el as Function).name
      case 'object':
         if (Array.isArray(el)) return el.map(toString)
         if (el instanceof Date) return el.getTime()
         return Object.fromEntries(
            Object.entries(el).map(([k, v]) => [k, toString(v)]),
         )
      case 'bigint':
      case 'number':
      case 'string':
      case 'boolean':
      case 'undefined':
         return el
      default:
         throw new BadRequestException('Unhandled type')
   }
}
const defaultResolver = (...args: any[]) => JSON.stringify(toString(args))

export const memorize = <Fn extends (...args: any[]) => any>(
   fn: Fn,
   resolver: (...args: Parameters<Fn>) => unknown = defaultResolver,
): Fn => {
   const cache = new Map<unknown, ReturnType<Fn>>()

   return ((...args: Parameters<Fn>) => {
      const key = resolver(...args)

      if (cache.has(key)) {
         return cache.get(key)
      }

      const value = fn(...args)
      cache.set(key, value)

      return value
   }) as Fn
}
