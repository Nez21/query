import { ElasticsearchModule } from '@nestjs/elasticsearch'
import { CatResolver } from './cat.resolver'
import { CatService } from './cat.service'
import { Module } from '@nestjs/common'
import { ElasticsearchAdapter } from 'lib/adapters/elasticsearch'

@Module({
   imports: [
      ElasticsearchModule.register({
         node: 'http://localhost:9200',
      }),
   ],
   providers: [ElasticsearchAdapter, CatService, CatResolver],
})
export class ElasticsearchAPIModule {}
