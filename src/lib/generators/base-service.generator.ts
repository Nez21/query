import { QueryInput } from './query.generator'
import { Paginated } from 'lib/interfaces/paginated.interface'
import { BadRequestException, Inject, Injectable, Scope } from '@nestjs/common'
import { GraphQLResolveInfo } from 'graphql'
import { Adapter } from 'lib/interfaces/adapter.interface'
import { plainToInstance } from 'class-transformer'
import { OutputType } from './output.generator'
import { parseResolveInfo } from 'graphql-parse-resolve-info'
import { intoSelections } from 'lib/utils/graphql'
import { CONTEXT } from '@nestjs/graphql'

export const BaseService = <TModel extends object, TQuery extends QueryInput<TModel>, TBuilder>(
   target: Constructor<TModel>,
   adapterType: Constructor<Adapter<TBuilder>>,
   contextFactory = (ctx: AnyObject) => ctx,
) => {
   @Injectable({ scope: Scope.REQUEST })
   class Placeholder {
      public ctx: ReturnType<typeof contextFactory>

      constructor(
         @Inject(adapterType) public adapter: Adapter<TBuilder>,
         @Inject(CONTEXT) ctx: AnyObject,
      ) {
         this.ctx = contextFactory(ctx)
      }

      async baseQuery(input: Omit<TQuery, 'paginate'>, selections: AnyObject) {
         input = await this.beforeQuery(input as TQuery)
         let builder = this.adapter.convert(target, input, selections)
         builder = await this.beforeRawQuery(builder)

         return builder
      }

      getSelections(info: GraphQLResolveInfo, paginated: boolean) {
         return intoSelections(parseResolveInfo(info), target, paginated)
      }

      async query(
         input: Omit<TQuery, 'paginate'>,
         info: GraphQLResolveInfo,
         limit?: number,
      ): Promise<TModel[]> {
         const selections = this.getSelections(info, false)
         const builder = await this.baseQuery(input, selections)
         let items = await this.adapter.query<TModel>(builder, limit)
         items = await this.afterQuery(
            items.map((item) => plainToInstance(OutputType(target), item)),
         )

         return items
      }

      async paginatedQuery(input: TQuery, info: GraphQLResolveInfo): Promise<Paginated<TModel>> {
         if (!input.paginate) {
            throw new BadRequestException()
         }

         const selections = this.getSelections(info, true)
         const builder = await this.baseQuery(input, selections)
         const result = await this.adapter.paginatedQuery<TModel>(builder, input.paginate)
         result.items = await this.afterQuery(
            result.items.map((item) => plainToInstance(OutputType(target), item)),
         )

         return result
      }

      async beforeQuery(input: TQuery): Promise<TQuery> {
         return input
      }

      async beforeRawQuery(builder: TBuilder): Promise<TBuilder> {
         return builder
      }

      async afterQuery(output: TModel[]): Promise<TModel[]> {
         return output
      }
   }

   return Placeholder
}
