import { Injectable } from '@nestjs/common'
import {
   DEFINITION_STORAGE,
   Definition,
} from 'lib/decorators/definition.decorator'
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
   LogicalOperator,
   OPERATORS,
   SortDirection,
} from 'lib/constants'
import { MAP_LOGICAL_OPERATORS, MAP_OPERATORS } from './snippets'
import { generate } from 'randomstring'
import { getJoinCondition } from './utils'
import { flatten } from 'lib/utils/object'

const RELATION_JOINER = '__'

@Injectable()
export class SqlAdapter implements Adapter<SelectQueryBuilder<object>> {
   constructor(private dataSource: DataSource) {}

   convert<T extends object>(
      target: Constructor<T>,
      input: Omit<QueryInput<T>, 'paginate'>,
      selections: Record<string, any>,
   ): SelectQueryBuilder<object> {
      const definition = DEFINITION_STORAGE.get(target)
      const metadata = this.dataSource.getMetadata(target)
      const alias = metadata.tableName
      const query = this.dataSource
         .getRepository(target)
         .createQueryBuilder(alias)

      const selects = this.buildQuery(
         { filter: input.filter as Record<string, any>, selections },
         { query },
         { definition, metadata },
         alias,
      )
      this.buildOrderByClause(query, input.sort ?? [], alias)
      query.select(R.uniq(selects))

      return query
   }

   buildQuery(
      input: {
         filter: Record<string, any>
         selections: Record<string, any>
      },
      builder: {
         query: SelectQueryBuilder<object>
         subQuery?: SelectQueryBuilder<object>
      },
      info: {
         definition: Definition
         metadata: EntityMetadata
      },
      alias: string,
      path: string[] = [],
   ): string[] {
      const selects = Object.keys(info.definition.properties).reduce(
         (acc, key) =>
            input.selections[key] ? [...acc, `${alias}.${key}`] : acc,
         [],
      )

      selects.push(
         ...info.metadata.primaryColumns.map(
            (el) => `${alias}.${el.propertyPath}`,
         ),
      )

      for (const key in info.definition.references) {
         if (!input.selections[key]) continue

         const relation = info.metadata.relations.find(
            (el) => el.propertyName == key,
         )

         if (!relation) {
            selects.push(`${alias}.${key}`)
         }

         const reference = info.definition.references[key]
         const referenceType = reference.type()
         const subDefinition = DEFINITION_STORAGE.get(referenceType)
         const nextPath = [...path, key]
         const relationAlias = nextPath.join(RELATION_JOINER)
         const relationFilter = input.filter[key]
         delete input.filter[key]

         const subQuery =
            relationFilter && !R.isEmpty(relationFilter) && reference.array
               ? this.dataSource.createQueryBuilder(
                    referenceType,
                    relationAlias,
                 )
               : null

         selects.push(
            ...this.buildQuery(
               { filter: relationFilter, selections: input.selections[key] },
               { query: builder.query, subQuery },
               { definition: subDefinition, metadata: relation.entityMetadata },
               relationAlias,
               nextPath,
            ),
         )

         if (subQuery) {
            const isAll = 'all' in relationFilter

            if (isAll) {
               const whereExpression = subQuery
                  // @ts-ignore
                  .createWhereExpression()
                  .replace(/^.*WHERE/, '')
               subQuery.where(`NOT (${whereExpression})`)
            }

            subQuery
               .select('1')
               .andWhere(getJoinCondition(alias, relationAlias, relation))
            builder.query.innerJoinAndSelect(
               `${alias}.${key}`,
               relationAlias,
               `${isAll ? 'NOT' : ''} EXISTS(${subQuery.getQuery()})`,
               subQuery.getParameters(),
            )
         } else {
            builder.query.leftJoinAndSelect(`${alias}.${key}`, relationAlias)
         }
      }

      if (input.filter && !R.isEmpty(input.filter)) {
         this.buildWhereClause(
            builder.subQuery ?? builder.query,
            input.filter,
            [alias],
         )
      }

      return selects
   }

   buildWhereClause(
      query: WhereExpressionBuilder,
      filter: Record<string, any>,
      path: string[],
   ) {
      if ('all' in filter) filter = filter['all']
      if ('any' in filter) filter = filter['any']

      for (const [field, value] of Object.entries(filter)) {
         if (LOGICAL_OPERATORS.includes(field)) {
            MAP_LOGICAL_OPERATORS[field as LogicalOperator](
               query,
               (value as unknown[]).map(
                  (el) =>
                     new Brackets((whereBuilder) =>
                        this.buildWhereClause(whereBuilder, el, path),
                     ),
               ),
            )
         } else if (
            OPERATORS.includes(field) ||
            ARRAY_OPERATORS.includes(field)
         ) {
            MAP_OPERATORS[field as BaseOperator | ArrayOperator]({
               query,
               databaseType: this.dataSource.driver.options.type,
               alias:
                  path.length > 2
                     ? R.slice(1, -1, path).join(RELATION_JOINER)
                     : path[0],
               field: R.last(path),
               key: generate({
                  length: 6,
                  charset: 'alphabetic',
                  capitalization: 'lowercase',
               }),
               value,
            })
         } else {
            this.buildWhereClause(query, value, [...path, field])
         }
      }
   }

   buildOrderByClause(
      query: SelectQueryBuilder<any>,
      input: Record<string, any>[],
      alias: string,
   ) {
      for (const orderBy of input) {
         const [key, value] = Object.entries(flatten(orderBy))[0] as [
            string,
            SortDirection,
         ]
         const path = key.split('.')
         const sortAlias =
            path.length > 1 ? R.slice(0, -1, path).join(RELATION_JOINER) : alias

         query.addOrderBy(
            `${sortAlias}.${R.last(path)}`,
            value.toUpperCase() as 'ASC' | 'DESC',
            'NULLS LAST',
         )
      }
   }

   async query<T extends object>(
      target: Constructor<T>,
      builder: SelectQueryBuilder<object>,
      limit?: number,
   ): Promise<T[]> {
      if (limit > 0) builder.limit(limit)

      return (await builder.getMany()) as T[]
   }

   async paginatedQuery<T extends object>(
      target: Constructor<T>,
      builder: SelectQueryBuilder<object>,
      paginate: PaginationInput,
   ): Promise<Paginated<T>> {
      builder.skip((paginate.page - 1) * paginate.size).take(paginate.size)
      const [items, totalItems] = (await builder.getManyAndCount()) as [
         T[],
         number,
      ]

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
