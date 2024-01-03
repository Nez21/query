import { SortDirection, mergeConfig } from 'lib/constants'
import { DEFINITION_STORAGE, Definition } from 'lib/decorators/definition.decorator'
import { PaginationInput, QueryInput } from 'lib/generators/query.generator'
import { Adapter } from 'lib/interfaces/adapter.interface'
import { Paginated } from 'lib/interfaces/paginated.interface'
import { getFilterType } from 'lib/utils/filter'
import { flatten } from 'lib/utils/object'
import mongoose, { Aggregate, Connection, PipelineStage } from 'mongoose'
import merge, { all as mergeAll } from 'deepmerge'
import { MAP_LIST_OPERATORS, MAP_LOGICAL_OPERATORS, MAP_OPERATORS } from './snippets'
import { InjectConnection } from '@nestjs/mongoose'
import { Injectable } from '@nestjs/common'
import R from 'ramda'

@Injectable()
export class MongoAdapter implements Adapter<Aggregate<object[]>> {
   constructor(@InjectConnection() private connection: Connection) {}

   convert<T extends object>(
      target: Constructor<T>,
      { filter, sort }: Omit<QueryInput<T>, 'paginate'>,
      selections?: AnyObject,
   ): Aggregate<object[]> {
      const definition = DEFINITION_STORAGE.get(target)
      const model = this.connection.model(definition.name)

      const aggregate = model.aggregate(
         this.buildQueryPipeline({
            definition,
            schema: model.schema,
            filter: filter as AnyObject,
            selections,
         }),
      )

      if (sort?.length) {
         aggregate.sort(flatten(mergeAll(sort)) as Record<string, SortDirection>)
      }

      aggregate.then = null // Prevent aggregate execute automatically when using await

      return aggregate
   }

   private buildQueryPipeline(input: {
      definition: Definition
      schema: mongoose.Schema
      filter: AnyObject
      selections: AnyObject
      path?: string[]
   }): Exclude<PipelineStage, PipelineStage.Merge | PipelineStage.Out>[] {
      const { definition, schema, filter = {}, selections, path = [] } = input

      const pipeline: Exclude<PipelineStage, PipelineStage.Merge | PipelineStage.Out>[] = []
      const selects = Object.keys(definition.properties).filter((key) => selections[key])
      const referenceSelects = {}

      for (const key in definition.references) {
         if (!selections[key]) continue

         const reference = definition.references[key]
         const referenceDefinition = DEFINITION_STORAGE.get(reference.type())
         const metadata = reference.metadata as {
            ref: string
            localField: string
            foreignField: string
         }
         const field = schema.path(key)
         const referenceTo: string = metadata.ref ?? field?.options?.ref
         const alias = [...path, key].join('-')

         if (!referenceTo) {
            selects.push(...Object.keys(flatten(selections[key], key)))
            continue
         }

         const localField = metadata.localField ?? key
         const foreignField = metadata.foreignField ?? '_id'
         const foreignFieldIsArray = (
            referenceDefinition.properties[foreignField] ??
            referenceDefinition.references[foreignField]
         ).array
         referenceSelects[key] = '$' + alias
         let relationFilter: AnyObject

         if (!reference.array) {
            relationFilter = filter[key]
            delete filter[key]
         }

         const subDefinition = DEFINITION_STORAGE.get(reference.type())
         const subPipeline = this.buildQueryPipeline({
            definition: subDefinition,
            schema: this.connection.model(subDefinition.name).schema,
            filter: relationFilter,
            selections: selections[key],
            path: [...path, key],
         })

         if (foreignFieldIsArray) {
            subPipeline.unshift({
               $match: { $expr: { $in: ['$$key', '$' + foreignField] } },
            })
         }

         pipeline.push({
            $lookup: {
               from: referenceTo,
               ...(foreignFieldIsArray
                  ? { let: { key: '$' + localField } }
                  : { localField, foreignField }),
               as: alias,
               pipeline: subPipeline,
            },
         })

         if (!reference.array) {
            pipeline.push({
               $unwind: {
                  path: '$' + alias,
                  preserveNullAndEmptyArrays: !relationFilter && !!reference.nullable,
               },
            })
         }
      }

      pipeline.push({
         $project: {
            _id: 1,
            ...Object.fromEntries(selects.map((select) => [select, 1])),
            ...referenceSelects,
         },
      })

      if (filter && !R.isEmpty(filter)) {
         pipeline.push({
            $match: this.buildMatchPipeline(filter),
         })
      }

      return pipeline
   }

   private buildMatchPipeline(input: AnyObject, path = []): AnyObject {
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
                  arr.map((value) => this.buildMatchPipeline(value, path)),
               ),
               mergeConfig,
            )
            break
         }
         case 'ListOperator': {
            const [type, value] = Object.entries(input)[0]
            result = merge(
               result,
               {
                  [path.join('.')]: MAP_LIST_OPERATORS[type](this.buildMatchPipeline(value)),
               },
               mergeConfig,
            )
            break
         }
         case 'Operator': {
            for (const [type, value] of Object.entries(input)) {
               result = merge(result, { [path.join('.')]: MAP_OPERATORS[type](value) }, mergeConfig)
            }
            break
         }
         default: {
            for (const [field, value] of Object.entries(input)) {
               result = merge(result, this.buildMatchPipeline(value, [...path, field]), mergeConfig)
            }
            break
         }
      }

      return result
   }

   async query<T extends object>(builder: Aggregate<object[]>, limit?: number): Promise<T[]> {
      if (limit > 0) builder.limit(limit)

      return (await builder.exec()) as T[]
   }

   async paginatedQuery<T extends object>(
      builder: Aggregate<object[]>,
      paginate: PaginationInput,
   ): Promise<Paginated<T>> {
      const [result] = await (
         builder.facet({
            items: [{ $skip: (paginate.page - 1) * paginate.size }, { $limit: paginate.size }],
            totalItems: [{ $count: 'count' }],
         }) as unknown as Aggregate<{ items: any[]; totalItems: { count: number }[] }[]>
      ).exec()

      const items = result?.items ?? []
      const totalItems = result?.totalItems?.[0]?.count ?? 0

      return {
         items,
         meta: {
            ...paginate,
            totalPages: Math.ceil(totalItems / paginate.size),
            totalItems,
         },
      }
   }
}
