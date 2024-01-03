import { Adapter } from 'lib/interfaces/adapter.interface'

import { Query, RequestBodySearch, Sort } from 'elastic-builder'
import { Injectable } from '@nestjs/common'
import { Paginated } from 'lib/interfaces/paginated.interface'
import { PaginationInput, QueryInput } from 'lib/generators/query.generator'
import {
   DEFINITION_STORAGE,
   Definition,
   getOptionByPath,
} from 'lib/decorators/definition.decorator'
import { flatten } from 'lib/utils/object'
import R from 'ramda'
import { getFilterType } from 'lib/utils/filter'
import merge from 'deepmerge'
import { MAP_LIST_OPERATORS, MAP_LOGICAL_OPERATORS, MAP_OPERATORS } from './snippets'
import { mergeConfig } from 'lib/constants'
import { ESPropMetadata, ESRefMetadata } from './types'
import { ElasticsearchService } from '@nestjs/elasticsearch'
import { PropertyOptions } from 'lib/decorators/property.decorator'
import { ReferenceOptions } from 'lib/decorators/reference.decorator'

@Injectable()
export class ElasticsearchAdapter
   implements Adapter<{ indexName: string; builder: RequestBodySearch }>
{
   constructor(private service: ElasticsearchService) {}

   convert<T extends object>(
      target: Constructor<T>,
      { filter, sort }: Omit<QueryInput<T>, 'paginate'>,
      selections: AnyObject,
   ): { indexName: string; builder: RequestBodySearch } {
      const definition = DEFINITION_STORAGE.get(target)
      const builder = new RequestBodySearch()

      builder.source(Object.keys(flatten(selections)))

      if (filter && !R.isEmpty(filter)) {
         const obj = this.buildQuery(definition, filter as AnyObject)
         const query = new Query(Object.keys(obj)[0])
         query['_body'] = obj
         builder.query(query)
      }

      if (sort?.length) {
         builder.sorts(this.buildSort(definition, sort))
      }

      return { indexName: definition.name, builder }
   }

   buildQuery(definition: Definition, input: AnyObject, path: string[] = []): AnyObject {
      let result: AnyObject = {}
      let type = getFilterType(input)

      if (type == 'Scalar') {
         input = { eq: input }
         type = 'Operator'
      }

      if (type == 'Object' && Object.keys(input).length > 1) {
         input = {
            and: Object.entries(input).map(([key, value]) => ({
               [key]: value,
            })),
         }
         type = 'LogicalOperator'
      }

      switch (type) {
         case 'LogicalOperator': {
            const [type, arr] = Object.entries(input)[0] as [string, any[]]
            result = merge(
               result,
               MAP_LOGICAL_OPERATORS[type](
                  arr.map((value) => this.buildQuery(definition, value, path)),
               ),
               mergeConfig,
            )
            break
         }
         case 'ListOperator': {
            const [type, value] = Object.entries(input)[0]
            const query = MAP_LIST_OPERATORS[type](this.buildQuery(definition, value, path))
            result = merge(result, query, mergeConfig)
            break
         }
         case 'Operator': {
            for (const [type, value] of Object.entries(input)) {
               const options = definition.properties[
                  R.last(path).split('.').pop()
               ] as PropertyOptions<ESPropMetadata>
               let query = MAP_OPERATORS[type](value, R.last(path), options.metadata.text)
               let nestedPath = path[0]

               for (let i = 1; i < path.length; i++) {
                  query = { nested: { path: nestedPath, query } }
                  nestedPath += `.${path[i]}`
               }

               result = merge(result, query, mergeConfig)
            }
            break
         }
         default: {
            for (const [field, value] of Object.entries(input)) {
               const options = definition.references[field] as ReferenceOptions<ESRefMetadata>

               result = merge(
                  result,
                  this.buildQuery(
                     definition.references[field]
                        ? DEFINITION_STORAGE.get(definition.references[field].type())
                        : definition,
                     value,
                     !path.length || options?.metadata?.nested
                        ? [...path, field]
                        : [...R.slice(0, -1, path), `${R.last(path)}.${field}`],
                  ),
                  mergeConfig,
               )
            }
            break
         }
      }

      return result
   }

   buildSort(definition: Definition, input: AnyObject[]): Sort[] {
      return input.map((el) => {
         const [field, order] = Object.entries(flatten(el))[0] as [string, string]
         const options = getOptionByPath<ESPropMetadata>(definition, field.split('.'))

         return new Sort(options.metadata.text ? `${field}.keyword` : field, order)
      })
   }

   async query<T extends object>(
      { indexName, builder }: { indexName: string; builder: RequestBodySearch },
      limit?: number,
   ): Promise<T[]> {
      if (limit > 0) builder.size(limit)

      const result = await this.service.search({
         index: indexName,
         body: builder.toJSON(),
      })

      return result.hits.hits.map((el) => ({ _id: el._id, ...(el._source as object) }) as T)
   }

   async paginatedQuery<T extends object>(
      { indexName, builder }: { indexName: string; builder: RequestBodySearch },
      paginate: PaginationInput,
   ): Promise<Paginated<T>> {
      builder.from((paginate.page - 1) * paginate.size).size(paginate.size)

      const result = await this.service.search({
         index: indexName,
         track_total_hits: true,
         body: builder.toJSON(),
      })

      return {
         items: result.hits.hits.map((el) => ({ _id: el._id, ...(el._source as object) }) as T),
         meta: {
            ...paginate,
            totalItems: result.hits.hits.length,
            totalPages: Math.ceil(result.took / paginate.size),
         },
      }
   }
}
