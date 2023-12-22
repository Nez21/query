import { Field, InputType } from '@nestjs/graphql'
import { Type } from 'class-transformer'
import { IsNotEmptyObject, IsOptional, ValidateNested } from 'class-validator'
import { FilterInput, FilterInputType } from './filter.generator'
import { memorize } from 'lib/utils/memorize'
import { OneOfObject } from 'lib/utils/validation'

const cache = new Map()

export type ListFilterInput<T> = {
   all?: Maybe<FilterInput<T>>
   any?: Maybe<FilterInput<T>>
}

export const ListFilterInputType = memorize(
   <T extends object>(
      target: Constructor<T>,
   ): Constructor<ListFilterInput<T>> => {
      if (cache.has(target.name)) return cache.get(target.name)

      const className = `${target.name}ListFilterInput`
      const subFilterType = FilterInputType(target)

      @InputType(className)
      class Placeholder {
         @Field(() => subFilterType, { nullable: true })
         @Type(() => subFilterType)
         @ValidateNested()
         @IsOptional()
         @IsNotEmptyObject({ nullable: false })
         @OneOfObject('ListOperator')
         all?: Maybe<FilterInput<T>>

         @Field(() => subFilterType, { nullable: true })
         @Type(() => subFilterType)
         @ValidateNested()
         @IsOptional()
         @IsNotEmptyObject({ nullable: false })
         @OneOfObject('ListOperator')
         any?: Maybe<FilterInput<T>>
      }

      Object.defineProperty(Placeholder, 'name', { value: className })
      cache.set(target.name, Placeholder)

      return Placeholder as Constructor<ListFilterInput<T>>
   },
)
