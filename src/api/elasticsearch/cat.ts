import { Schema } from '@nestjs/mongoose'
import { Vaccination } from './vaccination'
import { Definition } from 'lib/decorators/definition.decorator'
import { Property } from 'lib/decorators/property.decorator'
import { Reference } from 'lib/decorators/reference.decorator'
import { Owner } from './owner'
import { InputType, ObjectType } from '@nestjs/graphql'
import { OutputType, PaginatedOutputType } from 'lib/generators/output.generator'
import { QueryInputType } from 'lib/generators/query.generator'
import { ESPropMetadata } from 'lib/adapters/elasticsearch/types'

@Definition({ name: 'query.query' })
@Schema()
export class Cat {
   @Property({ name: 'id' })
   _id: string

   @Property<ESPropMetadata>({ metadata: { text: true } })
   name: string

   @Property()
   breed: string

   @Property()
   color: string

   @Property()
   birthDate: Date

   @Reference({ type: () => Owner })
   owner: Ref<Owner>

   @Reference({ type: () => Vaccination })
   vaccinations: Vaccination[]
}

@ObjectType('Cat')
export class ICat extends OutputType(Cat) {}

@ObjectType('CatList')
export class ICatList extends PaginatedOutputType(Cat) {}

@InputType()
export class CatQueryInput extends QueryInputType(Cat) {}
