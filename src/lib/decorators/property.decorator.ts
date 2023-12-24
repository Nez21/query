import { defaultComposer } from 'default-composer'
import { GraphQLScalarType } from 'graphql'
import { ARRAY_OPERATORS, ArrayOperator, BaseOperator, META_KEY } from 'lib/constants'
import { Metadata } from 'lib/utils/metadata'

export interface PropertyOptions<T extends Record<string, any> = Record<string, any>> {
   name: string
   type: () => Constructor | GraphQLScalarType
   filterable: boolean | BaseOperator[] | ArrayOperator[]
   sortable: boolean
   nullable: boolean
   complexity: number
   array: boolean
   metadata: T
}

export function Property<T extends Record<string, any> = Record<string, any>>(
   options?: Partial<PropertyOptions<T>>,
) {
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
            throw new Error()
         }
      }

      options = defaultComposer<PropertyOptions<T>>(
         {
            type: () => designType,
            name: propertyKey,
            filterable: true,
            sortable: !array,
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
