import { Injectable } from '@nestjs/common'
import { MongoAdapter } from 'lib/adapters/mongo'
import { BaseService } from 'lib/generators/base-service.generator'
import { Aggregate } from 'mongoose'
import { inspect } from 'util'
import { Cat } from './cat'
import chalk from 'chalk'

@Injectable()
export class CatService extends BaseService(Cat, MongoAdapter) {
   async beforeRawQuery(
      builder: Aggregate<object[]>,
   ): Promise<Aggregate<object[]>> {
      console.log(chalk.bgCyanBright('🚀 [Raw Query] '))
      console.log(chalk.cyan(inspect(builder, false, null, true)))
      return builder
   }

   async afterQuery(output: Cat[]): Promise<Cat[]> {
      console.log(chalk.bgBlueBright('🚀 [Result] '))
      console.log(chalk.blue(inspect(output, false, null, true)))
      return output
   }
}
