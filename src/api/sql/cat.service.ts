import { Injectable } from '@nestjs/common'
import { BaseService } from 'lib/generators/base-service.generator'
import { inspect } from 'util'
import { Cat } from './cat'
import { SqlAdapter } from 'lib/adapters/sql'
import { SelectQueryBuilder } from 'typeorm'
import { format } from 'sql-formatter'
import chalk from 'chalk'

@Injectable()
export class CatService extends BaseService(Cat, SqlAdapter) {
   async beforeRawQuery(builder: SelectQueryBuilder<object>): Promise<SelectQueryBuilder<object>> {
      console.log(chalk.bgCyanBright('🚀 [Raw Query] '))
      console.log(
         chalk
            .cyan(format(builder.getQuery(), { language: 'postgresql' }))
            .replaceAll(/:(\w{6})/g, (_, key) => ` :${key}`),
      )
      console.log(chalk.bgYellowBright('🚀 [Parameters] '))
      console.log(chalk.yellow(inspect(builder.getParameters(), false, null, true)))
      return builder
   }

   async afterQuery(output: Cat[]): Promise<Cat[]> {
      console.log(chalk.bgBlueBright('🚀 [Result] '))
      console.log(chalk.blue(inspect(output, false, null, true)))
      return output
   }
}
