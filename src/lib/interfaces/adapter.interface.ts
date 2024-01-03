import { PaginationInput, QueryInput } from 'lib/generators/query.generator'
import { Paginated } from './paginated.interface'

export interface Adapter<TBuilder> {
   convert<TModel extends object>(
      target: Constructor<TModel>,
      input: Omit<QueryInput<TModel>, 'paginate'>,
      selections: AnyObject,
   ): TBuilder
   query<TModel extends object>(builder: TBuilder, limit?: number): Promise<TModel[]>
   paginatedQuery<TModel extends object>(
      builder: TBuilder,
      paginate: PaginationInput,
   ): Promise<Paginated<TModel>>
}
