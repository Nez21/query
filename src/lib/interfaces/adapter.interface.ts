import { PaginationInput, QueryInput } from 'lib/generators/query.generator'
import { Paginated } from './paginated.interface'

export interface Adapter<TBuilder> {
   convert<TModel extends object>(
      target: Constructor<TModel>,
      input: Omit<QueryInput<TModel>, 'paginate'>,
      selections: Record<string, any>,
   ): TBuilder
   query<TModel extends object>(
      target: Constructor<TModel>,
      builder: TBuilder,
      limit?: number,
   ): Promise<TModel[]>
   paginatedQuery<TModel extends object>(
      target: Constructor<TModel>,
      builder: TBuilder,
      paginate: PaginationInput,
   ): Promise<Paginated<TModel>>
}
