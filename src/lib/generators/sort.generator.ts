import { Field, InputType } from '@nestjs/graphql'
import { Expose, Type } from 'class-transformer'
import { ValidateNested } from 'class-validator'
import { SortDirection } from 'lib/constants'
import { DEFINITION_STORAGE } from 'lib/decorators/definition.decorator'
import { OneOfObject } from 'lib/utils/validation'

export type SortInput<T extends object> = {
   [key in keyof T]?: Maybe<T[key] extends object ? SortInput<T[key]> : SortDirection>
}

const cache = new Map()

export const SortInputType = <T extends object>(
   target: Constructor<T>,
): Constructor<SortInput<T>> => {
   if (cache.has(target.name)) return cache.get(target.name)

   const className = `${target.name}SortInput`

   @InputType(className)
   class Placeholder {}

   Object.defineProperty(Placeholder, 'name', { value: className })
   cache.set(target.name, Placeholder)

   const { properties, references } = DEFINITION_STORAGE.get(target)

   for (const [key, options] of Object.entries(properties).filter(([_, val]) => val.sortable)) {
      Field(() => SortDirection, { nullable: true })(Placeholder.prototype, options.name)
      OneOfObject('Sort')(Placeholder.prototype, options.name)
      if (options.name != key) Expose({ name: options.name })(Placeholder.prototype, key)
   }

   for (const key in references) {
      const options = references[key]

      if (!options.array) {
         const subSortType = SortInputType(options.type())
         Field(() => subSortType, { nullable: true })(Placeholder.prototype, options.name)
         Type(() => subSortType)(Placeholder.prototype, options.name)
         ValidateNested()(Placeholder.prototype, options.name)
         OneOfObject('Sort')(Placeholder.prototype, options.name)
         if (options.name != key) Expose({ name: options.name })(Placeholder.prototype, key)
      }
   }

   return Placeholder as Constructor<SortInput<T>>
}
