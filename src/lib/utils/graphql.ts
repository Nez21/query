import { FieldsByTypeName, ResolveTree } from 'graphql-parse-resolve-info'
import { DEFINITION_STORAGE } from 'lib/decorators/definition.decorator'
import R from 'ramda'

export const intoSelections = (
   resolvedInfo: ResolveTree | FieldsByTypeName,
   target: Constructor<object>,
   paginated: boolean = false,
) => {
   if (R.isEmpty(resolvedInfo.fieldsByTypeName)) return {}

   const resourceTreeMap: FieldsByTypeName[any] = Object.values(resolvedInfo.fieldsByTypeName)[0]

   if (paginated) return intoSelections(resourceTreeMap['items'], target)

   const definition = DEFINITION_STORAGE.get(target)

   return Object.entries(resourceTreeMap).reduce((acc, [field, tree]) => {
      const [referenceKey, referenceOptions] =
         Object.entries(definition.references).find(([, val]) => val.name == field) ?? []

      if (referenceKey)
         return Object.assign(acc, {
            [referenceKey]: intoSelections(tree, referenceOptions.type()),
         })

      const [propertyKey] = Object.entries(definition.properties).find(
         ([, val]) => val.name == field,
      )

      return Object.assign(acc, {
         [propertyKey]: {},
      })
   }, {})
}
