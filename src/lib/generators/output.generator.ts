import { Field, Int, ObjectType } from '@nestjs/graphql'
import { Transform, Type } from 'class-transformer'
import { applyDecorators } from 'lib/decorators/decorate.decorator'
import { DEFINITION_STORAGE } from 'lib/decorators/definition.decorator'
import { Paginated } from 'lib/interfaces/paginated.interface'
import { memorize } from 'lib/utils/memorize'

const cache = new Map()

export const OutputType = memorize(<T extends object>(target: Constructor<T>) => {
   if (cache.has(target.name)) return cache.get(target.name)

   @ObjectType(target.name, { isAbstract: true })
   class Placeholder {}

   Object.defineProperty(Placeholder, 'name', { value: target.name })
   cache.set(target.name, Placeholder)

   const { properties, references, decorators } = DEFINITION_STORAGE.get(target)

   for (const key in properties) {
      const options = properties[key]
      const type = options.type()

      if (type == Date) {
         Transform(({ value }) => (value ? new Date(value) : null))(Placeholder.prototype, key)
      }

      Field(() => (options.array ? [type] : type), {
         name: options.name,
         nullable: options.nullable,
         complexity: options.complexity,
      })(Placeholder.prototype, key)
   }

   for (const key in references) {
      const options = references[key]
      const type = OutputType(options.type())

      Field(() => (options.array ? [type] : type), {
         name: options.name,
         nullable: options.nullable,
      })(Placeholder.prototype, key)
      Type(() => type)(Placeholder.prototype, key)
   }

   for (const key in decorators) {
      applyDecorators(Placeholder, key, decorators[key], 'output', false)
   }

   return Placeholder as Constructor<T>
})

@ObjectType()
export class PaginationMeta {
   @Field(() => Int)
   page: number

   @Field(() => Int)
   size: number

   @Field(() => Int)
   totalItems: number

   @Field(() => Int)
   totalPages: number
}

export function PaginatedOutputType<T extends object>(
   target: Constructor<T>,
): Constructor<Paginated<T>> {
   @ObjectType(`${target.name}List`, { isAbstract: true })
   class Placeholder {
      @Field(() => [OutputType(target)])
      items: T[]

      @Field(() => PaginationMeta)
      meta: PaginationMeta
   }

   return Placeholder
}
