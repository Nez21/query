import { Injectable } from '@nestjs/common'
import { DEFINITION_STORAGE, Definition } from 'lib/decorators/definition.decorator'
import { QueryInput, PaginationInput } from 'lib/generators/query.generator'
import { Adapter } from 'lib/interfaces/adapter.interface'
import { Paginated } from 'lib/interfaces/paginated.interface'
import {
   SelectQueryBuilder,
   DataSource,
   EntityMetadata,
   WhereExpressionBuilder,
   Brackets,
} from 'typeorm'
import R from 'ramda'
import {
   ARRAY_OPERATORS,
   ArrayOperator,
   BaseOperator,
   LOGICAL_OPERATORS,
   ListOperator,
   LogicalOperator,
   OPERATORS,
   SortDirection,
} from 'lib/constants'
import { MAP_LOGICAL_OPERATORS, MAP_OPERATORS } from './snippets'
import { generate } from 'randomstring'
import { flatten } from 'lib/utils/object'
import { extractRelationFilter, getJoinCondition } from './utils'
import { RelationMetadata } from 'typeorm/metadata/RelationMetadata'

const RELATION_JOINER = '__'

@Injectable()
export class SqlAdapter implements Adapter<SelectQueryBuilder<object>> {
   constructor(private dataSource: DataSource) {}

   convert<T extends object>(
      target: Constructor<T>,
      { filter, sort }: Omit<QueryInput<T>, 'paginate'>,
      selections: AnyObject,
   ): SelectQueryBuilder<object> {
      const definition = DEFINITION_STORAGE.get(target)
      const metadata = this.dataSource.getMetadata(target)
      const alias = metadata.tableName
      const query = this.dataSource.createQueryBuilder(target, alias)

      const selects = this.buildQuery({
         definition,
         metadata,
         query,
         filter: filter as AnyObject,
         selections,
         alias,
      })
      this.buildOrderByClause(query, sort ?? [], alias)
      query.select(R.uniq(selects))

      return query
   }

   buildQuery(input: {
      filter?: AnyObject
      selections: AnyObject
      query: SelectQueryBuilder<any>
      subQueryCondition?: WhereExpressionBuilder
      definition: Definition
      metadata: EntityMetadata
      alias: string
      path?: string[]
   }): string[] {
      const {
         definition,
         metadata,
         query,
         subQueryCondition,
         filter = {},
         selections,
         alias,
         path = [],
      } = input

      const selects = R.uniq(
         Object.keys(definition.properties).reduce(
            (acc, key) => (selections[key] ? [...acc, `${alias}.${key}`] : acc),
            metadata.primaryColumns.map((el) => `${alias}.${el.propertyPath}`),
         ),
      )

      for (const key in definition.references) {
         if (!selections[key]) continue

         const relation = metadata.relations.find((el) => el.propertyName == key)

         if (!relation) {
            selects.push(`${alias}.${key}`)
            continue
         }

         const reference = definition.references[key]
         const referenceType = reference.type()
         const referenceDefinition = DEFINITION_STORAGE.get(referenceType)

         const nextPath = [...path, key]
         const relationAlias = nextPath.join(RELATION_JOINER)
         const { value: relationFilter, listOperator } = extractRelationFilter(filter, key)

         const recursive = (condition: WhereExpressionBuilder) =>
            selects.push(
               ...this.buildQuery({
                  definition: referenceDefinition,
                  metadata: relation.inverseEntityMetadata ?? relation.entityMetadata,
                  query,
                  subQueryCondition: condition,
                  filter: relationFilter,
                  selections: selections[key],
                  alias: relationAlias,
                  path: nextPath,
               }),
            )

         const hasRelationFilter = relationFilter && !R.isEmpty(relationFilter)

         if (hasRelationFilter && reference.array) {
            const subQuery = this.dataSource.createQueryBuilder(referenceType, relationAlias)
            query.innerJoin(`${alias}.${key}`, relationAlias)
            subQuery.where(new Brackets((condition) => recursive(condition)))
            this.attachSubQueryToJoinCondition({ query, subQuery, relation, listOperator })
         } else if (hasRelationFilter || !reference.nullable) {
            query.innerJoin(`${alias}.${key}`, relationAlias)
            recursive(null)
         } else {
            query.leftJoin(`${alias}.${key}`, relationAlias)
            recursive(null)
         }
      }

      if (filter && !R.isEmpty(filter)) {
         this.buildWhereClause(subQueryCondition ?? query, filter, [alias])
      }

      return selects
   }

   attachSubQueryToJoinCondition(input: {
      query: SelectQueryBuilder<any>
      subQuery: SelectQueryBuilder<any>
      relation: RelationMetadata
      listOperator: ListOperator
   }) {
      const { query, subQuery, relation, listOperator } = input

      const whereExpression = subQuery
         // @ts-ignore
         .createWhereExpression()
         .replace(/^.*WHERE/, '')

      if (relation.isManyToMany) {
         subQuery.leftJoin(relation.joinTableName, relation.joinTableName, 'TRUE')
      }

      const joinAttribute = query.expressionMap.joinAttributes.find((el) => el.relation == relation)
      const alias = joinAttribute.parentAlias
      const relationAlias = joinAttribute.alias.name

      subQuery.select('1').where(getJoinCondition(alias, relationAlias, relation))

      if (listOperator == 'all') {
         subQuery.andWhere(`NOT ${whereExpression}`)
         joinAttribute.condition = `NOT EXISTS(${subQuery.getQuery()})`
      } else {
         subQuery.andWhere(whereExpression)
         joinAttribute.condition = `EXISTS(${subQuery.getQuery()})`
      }

      query.setParameters(subQuery.getParameters())
   }

   buildWhereClause(condition: WhereExpressionBuilder, filter: AnyObject, path: string[]) {
      if ('all' in filter) filter = filter['all']
      if ('any' in filter) filter = filter['any']

      for (const [field, value] of Object.entries(filter)) {
         if (LOGICAL_OPERATORS.includes(field)) {
            MAP_LOGICAL_OPERATORS[field as LogicalOperator](
               condition,
               (value as unknown[]).map(
                  (el) =>
                     new Brackets((whereBuilder) => this.buildWhereClause(whereBuilder, el, path)),
               ),
            )
         } else if (OPERATORS.includes(field) || ARRAY_OPERATORS.includes(field)) {
            MAP_OPERATORS[field as BaseOperator | ArrayOperator]({
               condition,
               databaseType: this.dataSource.driver.options.type,
               alias: path.length > 2 ? R.slice(1, -1, path).join(RELATION_JOINER) : path[0],
               field: R.last(path),
               key: generate({
                  length: 6,
                  charset: 'alphabetic',
                  capitalization: 'lowercase',
               }),
               value,
            })
         } else {
            this.buildWhereClause(condition, value, [...path, field])
         }
      }
   }

   buildOrderByClause(query: SelectQueryBuilder<any>, input: AnyObject[], alias: string) {
      for (const orderBy of input) {
         const [key, value] = Object.entries(flatten(orderBy))[0] as [string, SortDirection]
         const path = key.split('.')
         const sortAlias = path.length > 1 ? R.slice(0, -1, path).join(RELATION_JOINER) : alias

         query.addOrderBy(
            `${sortAlias}.${R.last(path)}`,
            value.toUpperCase() as 'ASC' | 'DESC',
            'NULLS LAST',
         )
      }
   }

   async query<T extends object>(
      builder: SelectQueryBuilder<object>,
      limit?: number,
   ): Promise<T[]> {
      if (limit > 0) builder.limit(limit)

      return (await builder.getMany()) as T[]
   }

   async paginatedQuery<T extends object>(
      builder: SelectQueryBuilder<object>,
      paginate: PaginationInput,
   ): Promise<Paginated<T>> {
      builder.skip((paginate.page - 1) * paginate.size).take(paginate.size)
      const [items, totalItems] = (await builder.getManyAndCount()) as [T[], number]

      return {
         items,
         meta: {
            ...paginate,
            totalItems,
            totalPages: Math.ceil(totalItems / paginate.size),
         },
      }
   }
}
