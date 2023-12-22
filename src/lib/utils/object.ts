export const flatten = (
   obj: Record<string, any>,
   path = '',
): Record<string, unknown> =>
   Object.keys(obj).reduce((acc, key) => {
      const currentPath = path ? `${path}.${key}` : key
      const value = obj[key]

      return typeof value != 'object' || !Object.keys(value).length
         ? Object.assign(acc, { [currentPath]: value })
         : Object.assign(acc, flatten(value, currentPath))
   }, {})
