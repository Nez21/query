import { defaultComposer } from 'default-composer'
import { GraphQLScalarType } from 'graphql'
import { ARRAY_OPERATORS, ArrayOperator, BaseOperator, META_KEY } from 'lib/constants'
import { Metadata } from 'lib/utils/metadata'

export interface PropertyOptions<T extends AnyObject = AnyObject> {
   name: string
   type: () => Constructor | GraphQLScalarType
   filterable: boolean | BaseOperator[] | ArrayOperator[]
   sortable: boolean
   nullable: boolean
   complexity: number
   array: boolean
   metadata: T
   description?: string
   deprecationReason?: string
}

export function Property<T extends AnyObject = AnyObject>(options?: Partial<PropertyOptions<T>>) {
   return (target: object, propertyKey: string) => {
      const designType = Reflect.getMetadata(
         META_KEY.DesignType,
         target,
         propertyKey,
      ) as Constructor
      const array = designType.name == 'Array'

      if (options?.filterable) {
         if (
            Array.isArray(options.filterable) &&
            array != options.filterable.every((el) => ARRAY_OPERATORS.includes(el))
         ) {
            throw new Error(
               `${propertyKey}: ${
                  array
                     ? 'BasicOperator is only used on primitive types / date'
                     : 'ArrayOperator is only used on array types'
               }`,
            )
         }
      }

      options = defaultComposer<PropertyOptions<T>>(
         {
            type: () => designType,
            name: propertyKey,
            sortable: array ? false : undefined,
            nullable: true,
            complexity: 1,
            array,
            metadata: {} as T,
         },
         options ?? {},
      )

      Metadata.append(target, META_KEY.Keys, propertyKey)
      Reflect.defineMetadata(META_KEY.Property, options, target, propertyKey)
   }
}
