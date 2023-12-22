import { Field, InputType, Int } from '@nestjs/graphql'
import {
   IsNotEmptyObject,
   IsOptional,
   Max,
   Min,
   ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { FilterInput, FilterInputType } from './filter.generator'
import { SortInput, SortInputType } from './sort.generator'

export interface QueryInput<T extends object = object> {
   filter?: Maybe<FilterInput<T>>
   sort?: Maybe<SortInput<T>[]>
   paginate?: Maybe<PaginationInput>
}

@InputType()
export class PaginationInput {
   @Min(1)
   @Field(() => Int)
   page: number

   @Min(1)
   @Max(50)
   @Field(() => Int)
   size: number
}

export const QueryInputType = <T extends object>(target: Constructor<T>) => {
   const filterType = FilterInputType(target)
   const sortType = SortInputType(target)

   if (!filterType) {
      throw new Error(`Missing filter type for ${target.name}`)
   }

   if (!sortType) {
      throw new Error(`Missing sort type for ${target.name}`)
   }

   const className = `${target.name}QueryInput`

   @InputType(className)
   class Placeholder implements QueryInput<T> {
      @Field(() => filterType, { nullable: true })
      @Type(() => filterType)
      @ValidateNested()
      filter?: Maybe<FilterInput<T>>

      @Field(() => [sortType], { nullable: true })
      @Type(() => sortType)
      @ValidateNested()
      @IsOptional()
      @IsNotEmptyObject({ nullable: false }, { each: true })
      sort?: Maybe<SortInput<T>[]>

      @Field(() => PaginationInput, { nullable: true })
      @Type(() => PaginationInput)
      @ValidateNested()
      paginate?: Maybe<PaginationInput>
   }

   Object.defineProperty(Placeholder, 'name', { value: className })

   return Placeholder
}
