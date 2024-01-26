import { MongooseModule } from '@nestjs/mongoose'
import { Cat, CatSchema } from './cat'
import { CatResolver } from './cat.resolver'
import { CatService } from './cat.service'
import { Owner, OwnerSchema } from './owner'
import { Vaccination, VaccinationSchema } from './vaccination'
import { Module } from '@nestjs/common'
import { MongoAdapter } from 'lib/adapters/mongo'

@Module({
   imports: [
      MongooseModule.forRoot('mongodb://root:Abcd1234@localhost:27017/query?authSource=admin'),
      MongooseModule.forFeature([
         { name: Cat.name, schema: CatSchema },
         { name: Owner.name, schema: OwnerSchema },
         { name: Vaccination.name, schema: VaccinationSchema },
      ]),
   ],
   providers: [MongoAdapter, CatService, CatResolver],
})
export class MongoAPIModule {}
