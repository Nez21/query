import { ValidationArguments, ValidationOptions, registerDecorator } from 'class-validator'
import { META_KEY } from 'lib/constants'
import { Metadata } from './metadata'

export function OneOfObject(group: string, validationOptions?: ValidationOptions) {
   return function (object: Object, propertyKey: string) {
      Metadata.append(object, META_KEY.Keys, propertyKey)
      Reflect.defineMetadata(META_KEY.OneOfObject, group, object, propertyKey)

      registerDecorator({
         name: 'oneOfObject',
         target: object.constructor,
         propertyName: propertyKey,
         constraints: [group],
         options: validationOptions,
         validator: {
            validate(value: any, args: ValidationArguments) {
               if (!value) return true

               const [group] = args.constraints
               const groupKeys = Object.entries(
                  Metadata.getAllPropertyMetadata(args.object, META_KEY.OneOfObject),
               ).reduce<string[]>(
                  (acc, [key, val]) => (key != args.property && val == group ? [...acc, key] : acc),
                  [],
               )

               return groupKeys.every((key) => !args.object[key])
            },

            defaultMessage: ({ constraints: [group] }) =>
               ` with group '${group}' only can have one value`,
         },
      })
   }
}
