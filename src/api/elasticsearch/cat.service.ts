import { Injectable } from '@nestjs/common'
import { BaseService } from 'lib/generators/base-service.generator'
import { inspect } from 'util'
import { Cat } from './cat'
import { ElasticsearchAdapter } from 'lib/adapters/elasticsearch'
import { RequestBodySearch } from 'elastic-builder'
import chalk from 'chalk'

@Injectable()
export class CatService extends BaseService(Cat, ElasticsearchAdapter) {
   async beforeRawQuery(raw: {
      indexName: string
      builder: RequestBodySearch
   }): Promise<{ indexName: string; builder: RequestBodySearch }> {
      console.log(chalk.bgGreenBright('🚀 [Raw Query] '))
      console.log(chalk.green(inspect(raw.builder.toJSON(), false, null, true)))
      return raw
   }

   async afterQuery(output: Cat[]): Promise<Cat[]> {
      console.log(chalk.bgBlueBright('🚀 [Result] '))
      console.log(chalk.blue(inspect(output, false, null, true)))
      return output
   }
}
