import { META_KEY } from 'lib/constants'
import { Metadata } from 'lib/utils/metadata'

export type DecorateScope = 'all' | 'input' | 'output'

export type DecorateOptions = {
   fn: ((array: boolean) => PropertyDecorator) | PropertyDecorator
   scope: DecorateScope
}

export function Decorate(
   fn: ((array: boolean) => PropertyDecorator) | PropertyDecorator,
   options: Omit<DecorateOptions, 'fn'> = { scope: 'all' },
): PropertyDecorator {
   return (target: object, propertyKey: string | symbol) =>
      Metadata.append(target, META_KEY.Decorate, { fn, ...options }, propertyKey)
}

export const applyDecoratorsWithScope = (
   target: Constructor<object>,
   propertyKey: string,
   decorators: DecorateOptions[],
   scope: Exclude<DecorateScope, 'all'>,
   array: boolean,
) => {
   decorators?.forEach((decorator) => {
      if (decorator.scope == 'all' || decorator.scope == scope) {
         decorator.fn.length == 1
            ? (decorator.fn as (array: boolean) => PropertyDecorator)(array)(
                 target.prototype,
                 propertyKey,
              )
            : decorator.fn(target.prototype, propertyKey)
      }
   })
}
