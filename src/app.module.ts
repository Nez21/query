import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
import { typeDefs as scalarTypeDefs } from 'graphql-scalars'
import { MongoAPIModule } from 'api/mongo/api.module'

@Module({
   imports: [
      GraphQLModule.forRoot<ApolloDriverConfig>({
         driver: ApolloDriver,
         autoSchemaFile: true,
         typeDefs: [...scalarTypeDefs],
         // plugins: [new ComplexityPlugin()],
      }),
      MongoAPIModule,
      // ElasticsearchAPIModule,
      // SqlAPIModule,
   ],
})
export class AppModule {}
