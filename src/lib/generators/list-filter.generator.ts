import { Field, InputType } from '@nestjs/graphql'
import { Type } from 'class-transformer'
import { IsNotEmptyObject, IsOptional, ValidateNested } from 'class-validator'
import { FilterInput, FilterInputType } from './filter.generator'
import { OneOfObject } from 'lib/utils/validation'
import { applyDecorators } from '@nestjs/common'

const cache = new Map()

export type ListFilterInput<T> = {
   all?: Maybe<FilterInput<T, false>>
   any?: Maybe<FilterInput<T, false>>
}

export const ListFilterInputType = <TModel extends object>(
   target: Constructor<TModel>,
): Constructor<ListFilterInput<TModel>> => {
   const className = `${target.name}ListFilterInput`

   if (cache.has(className)) return cache.get(className)

   const subFilterType = FilterInputType(target, false)

   @InputType(className)
   class Placeholder {}

   Object.defineProperty(Placeholder, 'name', { value: className })
   cache.set(className, Placeholder)

   const decorator = applyDecorators(
      Field(() => subFilterType, { nullable: true }),
      Type(() => subFilterType),
      ValidateNested(),
      IsOptional(),
      IsNotEmptyObject({ nullable: false }),
      OneOfObject('ListOperator'),
   )

   decorator(Placeholder.prototype, 'any')
   decorator(Placeholder.prototype, 'all')

   return Placeholder as Constructor<ListFilterInput<TModel>>
}
