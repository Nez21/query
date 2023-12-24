import { Plugin } from '@nestjs/apollo'
import { GraphQLError, GraphQLSchema } from 'graphql'
import { fieldExtensionsEstimator, getComplexity, simpleEstimator } from 'graphql-query-complexity'
import { ApolloServerPlugin, GraphQLRequestListener, GraphQLServerContext } from '@apollo/server'

@Plugin()
export class ComplexityPlugin implements ApolloServerPlugin {
   constructor(private maxComplexity = 25) {}

   private schema: GraphQLSchema

   async serverWillStart(service: GraphQLServerContext) {
      this.schema = service.schema
   }

   async requestDidStart(): Promise<GraphQLRequestListener<{}>> {
      const maxComplexity = this.maxComplexity
      const schema = this.schema

      return {
         async didResolveOperation({ request, document }) {
            const complexity = getComplexity({
               schema,
               operationName: request.operationName,
               query: document,
               variables: request.variables,
               estimators: [fieldExtensionsEstimator(), simpleEstimator({ defaultComplexity: 1 })],
            })

            if (complexity > maxComplexity) {
               throw new GraphQLError(
                  `Query is too complex: ${complexity}. Maximum allowed complexity: ${maxComplexity}`,
               )
            }
         },
      }
   }
}
