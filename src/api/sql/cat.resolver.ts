import { Args, Info, Query, Resolver } from '@nestjs/graphql'
import { GraphQLResolveInfo } from 'graphql'
import { CatService } from './cat.service'
import { CatQueryInput, ICatList } from './cat'

@Resolver()
export class CatResolver {
   constructor(private service: CatService) {}

   @Query(() => ICatList)
   async getCats(
      @Args('input', { type: () => CatQueryInput }) input: CatQueryInput,
      @Info() info: GraphQLResolveInfo,
   ) {
      return await this.service.paginatedQuery(input, info)
   }
}
