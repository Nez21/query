import { defaultComposer } from 'default-composer'
import { META_KEY } from 'lib/constants'
import { Metadata } from 'lib/utils/metadata'

export interface ReferenceOptions<T extends AnyObject = AnyObject> {
   name: string
   type: () => Constructor<object>
   array: boolean
   nullable: 'items' | 'itemsAndList' | boolean
   metadata: T
   complexFilterable: boolean
   description?: string
   deprecationReason?: string
}

export function Reference<T extends AnyObject = AnyObject>(
   options: Partial<Omit<ReferenceOptions<T>, 'array'>> & Pick<ReferenceOptions<T>, 'type'>,
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
            { name: propertyKey, array, nullable: true, complexFilterable: false, metadata: {} },
            options ?? {},
         ),
         target,
         propertyKey,
      )
   }
}
