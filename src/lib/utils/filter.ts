import {
   ARRAY_OPERATORS,
   LIST_OPERATORS,
   LOGICAL_OPERATORS,
   OPERATORS,
} from 'lib/constants'
import { Types } from 'mongoose'

export const getFilterType = (
   value: Record<string, unknown>,
): 'Scalar' | 'Operator' | 'ListOperator' | 'LogicalOperator' | 'Object' => {
   if (
      typeof value != 'object' ||
      value instanceof Date ||
      value instanceof Types.ObjectId
   )
      return 'Scalar'

   const keys = Object.keys(value)

   if (
      keys.every((el) => OPERATORS.includes(el) || ARRAY_OPERATORS.includes(el))
   )
      return 'Operator'
   if (keys.every((el) => LIST_OPERATORS.includes(el))) return 'ListOperator'
   if (keys.every((el) => LOGICAL_OPERATORS.includes(el)))
      return 'LogicalOperator'

   return 'Object'
}
