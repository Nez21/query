import { Field, InputType } from '@nestjs/graphql'
import { BaseOperator } from 'lib/constants'
import { GraphQLScalarType } from 'graphql'
import { memorize } from 'lib/utils/memorize'
import {
   DecorateOptions,
   applyDecorators,
} from 'lib/decorators/decorate.decorator'
import { pascalCase } from 'string-ts'
import { IsOptional } from 'class-validator'

export type OperatorInput<T> = T extends string
   ?
        | {
             [K in [
                'exists',
                'eq',
                'neq',
                'in',
                'nin',
             ][number]]?: OperatorToType<K, T>
          }
        | string
   : T extends number
     ?
          | {
               [K in [
                  'exists',
                  'eq',
                  'neq',
                  'in',
                  'nin',
                  'gt',
                  'gte',
                  'lt',
                  'lte',
               ][number]]?: OperatorToType<K, T>
            }
          | number
     : T extends boolean
       ? boolean
       : T extends Date
         ? {
              [K in [
                 'exists',
                 'gt',
                 'gte',
                 'lt',
                 'lte',
              ][number]]?: OperatorToType<K, T>
           }
         : never

export type OperatorToType<T extends BaseOperator, U> = T extends 'exists'
   ? boolean
   : T extends 'in' | 'nin'
     ? U[]
     : U

export const OperatorInputType = memorize(
   <T>(
      name: string,
      type: Constructor | GraphQLScalarType,
      filterable: boolean | BaseOperator[],
      decorators: DecorateOptions[] | null,
   ): Constructor<OperatorInput<T>> => {
      if (type.name == 'Boolean') return Boolean as any

      const className = `${pascalCase(name)}OperatorInput`

      @InputType(className)
      class Placeholder {}

      Object.defineProperty(Placeholder, 'name', { value: className })
      let operators =
         typeof filterable == 'boolean' || !filterable.length
            ? undefined
            : filterable
      operators ??= mapTypeToDefault(type)

      if (operators.length == 1 && operators[0] == 'eq') {
         return type as unknown as Constructor<OperatorInput<T>>
      }

      for (const operator of operators) {
         switch (operator) {
            case 'exists':
               Field(() => Boolean, { nullable: true })(
                  Placeholder.prototype,
                  operator,
               )
               break
            case 'in':
            case 'nin':
               Field(() => [type], { nullable: true })(
                  Placeholder.prototype,
                  operator,
               )
               applyDecorators(Placeholder, operator, decorators, 'input', true)
               break
            default:
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
         }

         IsOptional()(Placeholder.prototype, operator)
      }

      return Placeholder as Constructor<OperatorInput<T>>
   },
   (name) => name,
)

function mapTypeToDefault(
   type: Constructor | GraphQLScalarType,
): BaseOperator[] {
   switch (type.name) {
      case 'String':
         return ['exists', 'eq', 'neq', 'in', 'nin']
      case 'Date':
         return ['exists', 'gt', 'gte', 'lt', 'lte']
      case 'Number':
         return ['exists', 'eq', 'neq', 'in', 'nin', 'gt', 'gte', 'lt', 'lte']
      default:
         throw new Error('Unsupported data type')
   }
}
