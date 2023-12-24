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

const cache = new Map()

type ObjectFilterInput<T> = Partial<Record<LogicalOperator, Maybe<FilterInput<T>>[]>> & {
   [key in keyof T]?: Maybe<FilterInput<T[key]>>
}

export type FilterInput<T> = [OperatorInput<T>] extends [never]
   ? T extends (infer U)[]
      ? U extends object
         ? ListFilterInput<U>
         : ArrayOperatorInput<U>
      : ObjectFilterInput<T>
   : OperatorInput<T>

export const FilterInputType = <T extends object>(
   target: Constructor<T>,
   withReferences = true,
): Constructor<FilterInput<T>> => {
   const className = withReferences ? `${target.name}FilterInput` : `${target.name}BasicFilterInput`

   if (cache.has(className)) return cache.get(className)

   @InputType(className)
   class Placeholder {}

   Object.defineProperty(Placeholder, 'name', { value: className })
   cache.set(className, Placeholder)

   const withoutReferenceFilterType = FilterInputType(target, false)
   Field(() => [withoutReferenceFilterType], { nullable: true })(Placeholder.prototype, 'and')
   Type(() => withoutReferenceFilterType)(Placeholder.prototype, 'and')
   ValidateNested()(Placeholder.prototype, 'and')
   IsOptional()(Placeholder.prototype, 'and')
   ArrayMinSize(1)(Placeholder.prototype, 'and')
   IsNotEmptyObject({ nullable: false }, { each: true })(Placeholder.prototype, 'and')
   OneOfObject('LogicalOperator')(Placeholder.prototype, 'and')

   Field(() => [withoutReferenceFilterType], { nullable: true })(Placeholder.prototype, 'or')
   Type(() => withoutReferenceFilterType)(Placeholder.prototype, 'or')
   ValidateNested()(Placeholder.prototype, 'or')
   IsOptional()(Placeholder.prototype, 'or')
   ArrayMinSize(1)(Placeholder.prototype, 'or')
   IsNotEmptyObject({ nullable: false }, { each: true })(Placeholder.prototype, 'or')
   OneOfObject('LogicalOperator')(Placeholder.prototype, 'or')

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

      Field(() => subFilterType, { nullable: true })(Placeholder.prototype, options.name)

      if (![String, Number].includes(subFilterType as any)) {
         Type(() => subFilterType)(Placeholder.prototype, key)
         ValidateNested()(Placeholder.prototype, key)
         IsOptional()(Placeholder.prototype, key)
         IsNotEmptyObject({ nullable: false })(Placeholder.prototype, key)
      }

      if (options.name != key)
         Expose({ name: options.name, toClassOnly: true })(Placeholder.prototype, key)
   }

   if (withReferences)
      for (const key in references) {
         const options = references[key]
         const type = options.type()
         const subFilterType = options.array ? ListFilterInputType(type) : FilterInputType(type)

         Field(() => subFilterType, { nullable: true })(Placeholder.prototype, options.name)
         Type(() => subFilterType)(Placeholder.prototype, key)
         ValidateNested({ each: options.array })(Placeholder.prototype, key)
         IsOptional()(Placeholder.prototype, key)
         IsNotEmptyObject({ nullable: false })(Placeholder.prototype, key)
         if (options.name != key)
            Expose({ name: options.name, toClassOnly: true })(Placeholder.prototype, key)
      }

   return Placeholder as Constructor<FilterInput<T>>
}
