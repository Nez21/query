export interface Paginated<TModel = object> {
   items: TModel[]
   meta: {
      page: number
      size: number
      totalItems: number
      totalPages: number
   }
}
