import { META_KEY } from 'lib/constants'
import R from 'ramda'

export class Metadata {
   public static get<T>(
      target: object,
      metaKey: string | symbol,
      propertyKey?: string | symbol,
      throwIfNotFound = true,
   ): T {
      const value = Reflect.getMetadata(metaKey, target, propertyKey)

      if (throwIfNotFound && !value) {
         throw new Error(
            `Missing metadata ${metaKey.toString()} for ${
               target.constructor.name
            }`,
         )
      }

      return value
   }

   public static append<T>(
      target: object,
      metaKey: string | symbol,
      value: T,
      propertyKey?: string | symbol,
   ): void {
      const values = Reflect.getMetadata(metaKey, target, propertyKey) ?? []

      if (!Array.isArray(values)) {
         throw new Error(`Metadata ${metaKey.toString()} is not an array`)
      }

      values.push(value)
      Reflect.defineMetadata(metaKey, values, target, propertyKey)
   }

   public static getAllPropertyMetadata<T>(
      target: Constructor | object,
      metaKey: string | symbol,
      throwIfNotFound = false,
   ): Record<string, T> {
      const prototype = typeof target == 'function' ? target.prototype : target
      const properties = Metadata.get<string[]>(
         prototype,
         META_KEY.Keys,
         undefined,
         true,
      )
      const metadata: Record<string, T> = {}

      for (const key of properties) {
         const propertyMetadata = Reflect.getMetadata(metaKey, prototype, key)

         if (propertyMetadata) {
            metadata[key] = propertyMetadata
         }
      }

      if (throwIfNotFound && R.isEmpty(metadata)) {
         throw new Error(
            `Missing metadata ${metaKey.toString()} for ${
               target.constructor.name
            }`,
         )
      }

      return metadata
   }
}
