import { defaultComposer } from 'default-composer'
import { META_KEY } from 'lib/constants'
import { Metadata } from 'lib/utils/metadata'

export interface ReferenceOptions<
   T extends Record<string, any> = Record<string, any>,
> {
   name: string
   type: () => Constructor<object>
   array: boolean
   nullable: 'items' | 'itemsAndList' | boolean
   metadata: T
}

export function Reference<T extends Record<string, any> = Record<string, any>>(
   options: Partial<ReferenceOptions<T>> & Pick<ReferenceOptions<T>, 'type'>,
) {
   return (target: object, propertyKey: string) => {
      const designType = Reflect.getMetadata(
         META_KEY.DesignType,
         target,
         propertyKey,
      ) as Constructor
      const array = designType.name == 'Array'

      Metadata.append(target, META_KEY.Keys, propertyKey)
      Reflect.defineMetadata(
         META_KEY.Reference,
         defaultComposer<ReferenceOptions>(
            { name: propertyKey, array, nullable: true, metadata: {} },
            options ?? {},
         ),
         target,
         propertyKey,
      )
   }
}
