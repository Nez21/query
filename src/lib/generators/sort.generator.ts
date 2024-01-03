import { applyDecorators } from '@nestjs/common'
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
   const className = `${target.name}SortInput`

   if (cache.has(className)) return cache.get(className)

   @InputType(className)
   class Placeholder {}

   Object.defineProperty(Placeholder, 'name', { value: className })
   cache.set(className, Placeholder)

   const { properties, references } = DEFINITION_STORAGE.get(target)

   for (const [key, options] of Object.entries(properties).filter(([_, val]) => val.sortable)) {
      applyDecorators(
         Field(() => SortDirection, { nullable: true }),
         OneOfObject('Sort'),
      )(Placeholder.prototype, options.name)

      if (options.name != key) {
         Expose({ name: options.name, toClassOnly: true })(Placeholder.prototype, key)
      }
   }

   for (const key in references) {
      const options = references[key]

      if (!options.array) {
         const subSortType = SortInputType(options.type())

         applyDecorators(
            Field(() => subSortType, { nullable: true }),
            Type(() => subSortType),
            ValidateNested(),
            OneOfObject('Sort'),
         )(Placeholder.prototype, options.name)

         if (options.name != key) {
            Expose({ name: options.name, toClassOnly: true })(Placeholder.prototype, key)
         }
      }
   }

   return Placeholder as Constructor<SortInput<T>>
}
