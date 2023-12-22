import {
   ArrayOperator,
   BaseOperator,
   ListOperator,
   LogicalOperator,
} from 'lib/constants'

export const MAP_OPERATORS: Record<
   BaseOperator | ArrayOperator,
   (value: unknown, path: string, isText: boolean) => unknown
> = {
   eq: (value, path, isText) => ({
      term: isText ? { [`${path}.keyword`]: value } : { [path]: value },
   }),
   neq: (value, path, isText) => ({
      bool: { must_not: MAP_OPERATORS.eq(value, path, isText) },
   }),
   exists: (value, path) =>
      value
         ? { exists: { field: path } }
         : { bool: { must_not: { exists: { field: path } } } },
   in: (value, path, isText) => ({
      terms: isText ? { [`${path}.keyword`]: value } : { [path]: value },
   }),
   nin: (value, path, isText) => ({
      bool: { must_not: MAP_OPERATORS.in(value, path, isText) },
   }),
   lt: (value, path) => ({ range: { [path]: { lt: value } } }),
   lte: (value, path) => ({ range: { [path]: { lte: value } } }),
   gt: (value, path) => ({ range: { [path]: { gt: value } } }),
   gte: (value, path) => ({ range: { [path]: { gte: value } } }),

   contains: (value, path, isText) => ({
      term: isText ? { [`${path}.keyword`]: value } : { [path]: value },
   }),
   ncontains: (value, path, isText) => ({
      bool: { must_not: MAP_OPERATORS.ncontains(value, path, isText) },
   }),
   overlap: (value, path, isText) => ({
      terms: isText ? { [`${path}.keyword`]: value } : { [path]: value },
   }),
} as const

export const MAP_LIST_OPERATORS: Record<
   ListOperator,
   (query: unknown) => unknown
> = {
   all: (query) => ({ bool: { must: query } }),
   any: (query) => ({ bool: { should: query } }),
} as const

export const MAP_LOGICAL_OPERATORS: Record<
   LogicalOperator,
   (query: unknown) => unknown
> = {
   and: (query) => ({ bool: { must: query } }),
   or: (query) => ({ bool: { should: query } }),
} as const
