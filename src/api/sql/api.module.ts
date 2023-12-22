import { SqlAdapter } from 'lib/adapters/sql'
import { Cat } from './cat'
import { Owner } from './owner'
import { Vaccination } from './vaccination'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CatService } from './cat.service'
import { CatResolver } from './cat.resolver'

@Module({
   imports: [
      TypeOrmModule.forRoot({
         type: 'postgres',
         url: 'postgresql://postgres:Abcd1234@localhost:5432/query',
         entities: [Cat, Owner, Vaccination],
         synchronize: true,
      }),
   ],
   providers: [SqlAdapter, CatService, CatResolver],
})
export class SqlAPIModule {}
