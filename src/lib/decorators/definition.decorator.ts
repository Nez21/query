import { Metadata } from 'lib/utils/metadata'
import { ReferenceOptions } from './reference.decorator'
import { DecorateOptions } from './decorate.decorator'
import { PropertyOptions } from './property.decorator'
import { META_KEY } from 'lib/constants'
import { defaultComposer } from 'default-composer'

export interface DefinitionOptions {
   name: string
}

export type Definition = DefinitionOptions & {
   properties: Record<string, PropertyOptions>
   references: Record<string, ReferenceOptions>
   decorators: Record<string, DecorateOptions[]>
}

export const DEFINITION_STORAGE = new Map<Constructor<object>, Definition>()

export function Definition(options?: DefinitionOptions) {
   return (target: Constructor<object>) => {
      const properties = Metadata.getAllPropertyMetadata<PropertyOptions>(
         target,
         META_KEY.Property,
      )
      const references = Metadata.getAllPropertyMetadata<ReferenceOptions>(
         target,
         META_KEY.Reference,
      )
      const decorators = Metadata.getAllPropertyMetadata<DecorateOptions[]>(
         target,
         META_KEY.Decorate,
      )

      DEFINITION_STORAGE.set(target, {
         ...defaultComposer<DefinitionOptions>(
            { name: target.name },
            options ?? {},
         ),
         properties,
         references,
         decorators,
      })
   }
}

export const getOptionByPath = <T>(
   definition: Definition,
   [field, ...path]: string[] = [],
): PropertyOptions<T> =>
   !path.length
      ? (definition.properties[field] as PropertyOptions<T>)
      : getOptionByPath(
           DEFINITION_STORAGE.get(definition.references[field].type()),
           path,
        )
