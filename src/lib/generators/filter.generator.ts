import { Field, InputType } from '@nestjs/graphql'
import { Expose, Type } from 'class-transformer'
import { ArrayMinSize, IsNotEmptyObject, IsOptional, ValidateNested } from 'class-validator'

import { ArrayOperatorInput, ArrayOperatorInputType } from './array-operator.generator'
import { DEFINITION_STORAGE } from 'lib/decorators/definition.decorator'
import { pascalCase } from 'string-ts'
import { OperatorInput, OperatorInputType } from './operator.generator'
import { ListFilterInputType, ListFilterInput } from './list-filter.generator'
import { ArrayOperator, BaseOperator, LogicalOperator } from 'lib/constants'
import { OneOfObject } from 'lib/utils/validation'
import { applyDecorators } from '@nestjs/common'

const cache = new Map()

type ObjectFilterInput<TModel, WithReference> = Partial<
   Record<LogicalOperator, Maybe<FilterInput<TModel, false>>[]>
> & {
   [key in {
      [subKey in keyof TModel]: TModel[subKey] extends object[] | object
         ? WithReference extends false
            ? never
            : subKey
         : subKey
   }[keyof TModel]]?: Maybe<FilterInput<TModel[key], false>>
}

export type FilterInput<TModel, WithReference = true> = [OperatorInput<TModel>] extends [never]
   ? TModel extends (infer Item)[]
      ? Item extends object
         ? ListFilterInput<Item>
         : ArrayOperatorInput<Item>
      : ObjectFilterInput<TModel, WithReference>
   : OperatorInput<TModel>

export const FilterInputType = <T extends object>(
   target: Constructor<T>,
   withReference = true,
): Constructor<FilterInput<T>> => {
   const className = withReference ? `${target.name}FilterInput` : `${target.name}BasicFilterInput`

   if (cache.has(className)) return cache.get(className)

   @InputType(className)
   class Placeholder {}

   Object.defineProperty(Placeholder, 'name', { value: className })
   cache.set(className, Placeholder)

   const subFilterType = FilterInputType(target, false)
   const decorator = applyDecorators(
      Field(() => [subFilterType], { nullable: true }),
      Type(() => subFilterType),
      ValidateNested(),
      IsOptional(),
      ArrayMinSize(1),
      IsNotEmptyObject({ nullable: false }, { each: true }),
      OneOfObject('LogicalOperator'),
   )

   decorator(Placeholder.prototype, 'and')
   decorator(Placeholder.prototype, 'or')

   const { properties, references, decorators } = DEFINITION_STORAGE.get(target)

   for (const [key, options] of Object.entries(properties).filter(([_, val]) => val.filterable)) {
      const name = `${target.name}${pascalCase(key)}`
      const type = options.type()
      const subFilterType = options.array
         ? ArrayOperatorInputType(
              name,
              type,
              options.filterable as boolean | ArrayOperator[],
              decorators[key],
           )
         : OperatorInputType(
              name,
              type,
              options.filterable as boolean | BaseOperator[],
              decorators[key],
           )

      Field(() => subFilterType, {
         nullable: true,
         description: options.description,
         deprecationReason: options.deprecationReason,
      })(Placeholder.prototype, options.name)

      if (![String, Number].includes(subFilterType as any)) {
         applyDecorators(
            Type(() => subFilterType),
            ValidateNested(),
            IsOptional(),
            IsNotEmptyObject({ nullable: false }),
         )(Placeholder.prototype, key)
      }

      if (options.name != key) {
         Expose({ name: options.name, toClassOnly: true })(Placeholder.prototype, key)
      }
   }

   for (const key in references) {
      const options = references[key]

      if (withReference && !options.complexFilterable) {
         continue
      }

      const type = options.type()
      const subFilterType = options.array ? ListFilterInputType(type) : FilterInputType(type)

      Field(() => subFilterType, {
         nullable: true,
         description: options.description,
         deprecationReason: options.deprecationReason,
      })(Placeholder.prototype, options.name)

      applyDecorators(
         Type(() => subFilterType),
         ValidateNested({ each: options.array }),
         IsOptional(),
         IsNotEmptyObject({ nullable: false }),
      )(Placeholder.prototype, key)

      if (options.name != key) {
         Expose({ name: options.name, toClassOnly: true })(Placeholder.prototype, key)
      }
   }

   return Placeholder as Constructor<FilterInput<T>>
}
