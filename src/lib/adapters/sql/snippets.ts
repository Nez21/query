import { ArrayOperator, BaseOperator, LogicalOperator } from 'lib/constants'
import { Brackets, WhereExpressionBuilder } from 'typeorm'

export const MAP_OPERATORS: Record<
   BaseOperator | ArrayOperator,
   (input: {
      query: WhereExpressionBuilder
      databaseType: string
      alias: string
      field: string
      key: string
      value: unknown
   }) => void
> = {
   eq: ({ query, alias, field, key, value }) =>
      query.andWhere(`${alias}.${field} = :${key}`, { [key]: value }),
   neq: ({ query, alias, field, key, value }) =>
      query.andWhere(`${alias}.${field} != :${key}`, { [key]: value }),
   exists: ({ query, alias, field, value }) =>
      query.andWhere(`${alias}.${field} IS ${value ? 'NOT' : ''} NULL`),
   in: ({ query, alias, field, key, value }) =>
      query.andWhere(`${alias}.${field} = ANY (:${key})`, { [key]: value }),
   nin: ({ query, alias, field, key, value }) =>
      query.andWhere(`${alias}.${field} != ALL (:${key})`, { [key]: value }),
   lt: ({ query, alias, field, key, value }) =>
      query.andWhere(`${alias}.${field} < :${key}`, { [key]: value }),
   lte: ({ query, alias, field, key, value }) =>
      query.andWhere(`${alias}.${field} <= :${key}`, { [key]: value }),
   gt: ({ query, alias, field, key, value }) =>
      query.andWhere(`${alias}.${field} > :${key}`, { [key]: value }),
   gte: ({ query, alias, field, key, value }) =>
      query.andWhere(`${alias}.${field} >= :${key}`, { [key]: value }),

   contains: ({ query, alias, field, key, value }) =>
      query.andWhere(`:${key} = ANY (${alias}.${field})`, { [key]: value }),
   ncontains: ({ query, alias, field, key, value }) =>
      query.andWhere(`:${key} != ALL (${alias}.${field})`, { [key]: value }),
   overlap: ({ query, alias, field, key, value }) =>
      query.andWhere(`${alias}.${field} && :${key}`, { [key]: value }),
} as const

export const MAP_LOGICAL_OPERATORS: Record<
   LogicalOperator,
   (builder: WhereExpressionBuilder, value: Brackets[]) => unknown
> = {
   and: (query, value) => value.forEach((el) => query.andWhere(el)),
   or: (query, value) => value.forEach((el) => query.orWhere(el)),
} as const
