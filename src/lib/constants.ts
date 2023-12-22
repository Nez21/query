import { registerEnumType } from '@nestjs/graphql'
import { isPlainObject } from 'is-plain-object'

export const mergeConfig = {
   isMergeableObject: isPlainObject,
}

export const META_KEY = {
   DesignType: 'design:type',
   ParamTypes: 'design:paramTypes',
   ReturnType: 'design:returnType',

   Definition: Symbol('definition'),
   Keys: Symbol('keys'),
   AfterLoad: Symbol('afterLoad'),
   Decorate: Symbol('decorate'),
   Property: Symbol('property'),
   Reference: Symbol('reference'),

   OneOfObject: Symbol('oneOfObject'),
} as const

export enum SortDirection {
   ASC = 'asc',
   DESC = 'desc',
}

export const OPERATORS = [
   'eq',
   'neq',
   'gt',
   'gte',
   'lt',
   'lte',
   'in',
   'nin',
   'exists',
] as const
export const ARRAY_OPERATORS = [
   'contains',
   'ncontains',
   'overlap',
   'exists',
] as const
export const LIST_OPERATORS = ['all', 'any'] as const
export const LOGICAL_OPERATORS = ['and', 'or'] as const

export type ArrayOperator = (typeof ARRAY_OPERATORS)[number]
export type ListOperator = (typeof LIST_OPERATORS)[number]
export type BaseOperator = (typeof OPERATORS)[number]
export type LogicalOperator = (typeof LOGICAL_OPERATORS)[number]

registerEnumType(SortDirection, { name: 'SortDirection' })
