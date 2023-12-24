import { ArrayOperator, BaseOperator, ListOperator, LogicalOperator } from 'lib/constants'

export const MAP_OPERATORS: Record<BaseOperator | ArrayOperator, (value: unknown) => unknown> = {
   eq: (value) => ({ $eq: value }),
   neq: (value) => ({ $ne: value }),
   exists: (value) => ({ $exists: value }),
   in: (value) => ({ $in: value }),
   nin: (value) => ({ $nin: value }),
   lt: (value) => ({ $lt: value }),
   lte: (value) => ({ $lte: value }),
   gt: (value) => ({ $gt: value }),
   gte: (value) => ({ $gte: value }),

   contains: (value) => ({ $all: [value] }),
   ncontains: (value) => ({ $not: { $all: [value] } }),
   overlap: (value) => ({ $elemMatch: { $in: value } }),
} as const

export const MAP_LIST_OPERATORS: Record<ListOperator, (value: unknown) => unknown> = {
   all: (value) => {
      const [key, query] = Object.entries(value)[0]
      return {
         $not: {
            $elemMatch: { [key]: { $not: query } },
         },
      }
   },
   any: (query) => ({ $elemMatch: query }),
} as const

export const MAP_LOGICAL_OPERATORS: Record<LogicalOperator, (value: unknown) => unknown> = {
   and: (value) => ({ $and: value }),
   or: (value) => ({ $or: value }),
} as const
