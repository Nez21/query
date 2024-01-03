import { ArrayOperator, BaseOperator, LogicalOperator } from 'lib/constants'
import { Brackets, WhereExpressionBuilder } from 'typeorm'

export const MAP_OPERATORS: Record<
   BaseOperator | ArrayOperator,
   (input: {
      condition: WhereExpressionBuilder
      databaseType: string
      alias: string
      field: string
      key: string
      value: unknown
   }) => void
> = {
   eq: ({ condition, alias, field, key, value }) =>
      condition.andWhere(`${alias}.${field} = :${key}`, { [key]: value }),
   neq: ({ condition, alias, field, key, value }) =>
      condition.andWhere(`${alias}.${field} != :${key}`, { [key]: value }),
   exists: ({ condition, alias, field, value }) =>
      condition.andWhere(`${alias}.${field} IS ${value ? 'NOT' : ''} NULL`),
   in: ({ condition, alias, field, key, value }) =>
      condition.andWhere(`${alias}.${field} = ANY (:${key})`, { [key]: value }),
   nin: ({ condition, alias, field, key, value }) =>
      condition.andWhere(`${alias}.${field} != ALL (:${key})`, { [key]: value }),
   lt: ({ condition, alias, field, key, value }) =>
      condition.andWhere(`${alias}.${field} < :${key}`, { [key]: value }),
   lte: ({ condition, alias, field, key, value }) =>
      condition.andWhere(`${alias}.${field} <= :${key}`, { [key]: value }),
   gt: ({ condition, alias, field, key, value }) =>
      condition.andWhere(`${alias}.${field} > :${key}`, { [key]: value }),
   gte: ({ condition, alias, field, key, value }) =>
      condition.andWhere(`${alias}.${field} >= :${key}`, { [key]: value }),

   contains: ({ condition, alias, field, key, value }) =>
      condition.andWhere(`:${key} = ANY (${alias}.${field})`, { [key]: value }),
   ncontains: ({ condition, alias, field, key, value }) =>
      condition.andWhere(`:${key} != ALL (${alias}.${field})`, { [key]: value }),
   overlap: ({ condition, alias, field, key, value }) =>
      condition.andWhere(`${alias}.${field} && :${key}`, { [key]: value }),
} as const

export const MAP_LOGICAL_OPERATORS: Record<
   LogicalOperator,
   (condition: WhereExpressionBuilder, brackets: Brackets[]) => unknown
> = {
   and: (condition, brackets) => brackets.forEach((el) => condition.andWhere(el)),
   or: (condition, brackets) => brackets.forEach((el) => condition.orWhere(el)),
} as const
