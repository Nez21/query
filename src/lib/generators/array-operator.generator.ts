import { Field, InputType } from '@nestjs/graphql'
import { IsOptional } from 'class-validator'
import { GraphQLScalarType } from 'graphql'
import { ARRAY_OPERATORS, ArrayOperator } from 'lib/constants'
import {
   DecorateOptions,
   applyDecorators,
} from 'lib/decorators/decorate.decorator'
import { memorize } from 'lib/utils/memorize'
import { singular } from 'pluralize'
import { pascalCase } from 'string-ts'

export type ArrayOperatorInput<T> = {
   exists?: boolean
   contains?: T
   ncontains?: T
   overlap?: T[]
}

export const ArrayOperatorInputType = memorize(
   <T>(
      name: string,
      type: Constructor | GraphQLScalarType,
      filterable: boolean | ArrayOperator[],
      decorators: DecorateOptions[] | null,
   ): Constructor<ArrayOperatorInput<T>> => {
      const className = `${pascalCase(singular(name))}ArrayOperatorInput`

      @InputType(className)
      class Placeholder {}

      Object.defineProperty(Placeholder, 'name', { value: className })
      const operators: ArrayOperator[] =
         typeof filterable == 'boolean' || !filterable.length
            ? (ARRAY_OPERATORS as unknown as ArrayOperator[])
            : filterable

      for (const operator of operators) {
         switch (operator) {
            case 'contains':
            case 'ncontains':
               Field(() => type, { nullable: true })(
                  Placeholder.prototype,
                  operator,
               )
               applyDecorators(
                  Placeholder,
                  operator,
                  decorators,
                  'input',
                  false,
               )
               break
            case 'overlap':
               Field(() => [type], { nullable: true })(
                  Placeholder.prototype,
                  operator,
               )
               applyDecorators(Placeholder, operator, decorators, 'input', true)
               break
            case 'exists':
               Field(() => Boolean, { nullable: true })(
                  Placeholder.prototype,
                  operator,
               )
               break
            default:
               throw new Error()
         }

         IsOptional()(Placeholder.prototype, operator)
      }

      return Placeholder as Constructor<ArrayOperatorInput<T>>
   },
   (name) => name,
)
