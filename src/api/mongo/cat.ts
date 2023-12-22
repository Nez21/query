import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import mongoose, { Document, Types } from 'mongoose'
import { Vaccination, VaccinationSchema } from './vaccination'
import { Definition } from 'lib/decorators/definition.decorator'
import { Property } from 'lib/decorators/property.decorator'
import { Reference } from 'lib/decorators/reference.decorator'
import { Owner } from './owner'
import { InputType, ObjectType } from '@nestjs/graphql'
import {
   OutputType,
   PaginatedOutputType,
} from 'lib/generators/output.generator'
import { QueryInputType } from 'lib/generators/query.generator'
import { ExposeObjectId } from 'lib/adapters/mongo/utils'

@Definition()
@Schema()
export class Cat {
   @ExposeObjectId
   @Property({ name: 'id', type: () => String })
   @Prop({ type: Types.ObjectId })
   _id: Types.ObjectId

   @Property()
   @Prop()
   name: string

   @Property()
   @Prop()
   breed: string

   @Property()
   @Prop()
   color: string

   @Property()
   @Prop()
   birthDate: Date

   @Reference({ type: () => Owner })
   @Prop({ type: [mongoose.Schema.ObjectId], ref: 'owners' })
   owner: Ref<Owner>

   @Reference({ type: () => Vaccination })
   @Prop({ type: [VaccinationSchema] })
   vaccinations: Vaccination[]
}

export type CatDocument = Cat & Document
export const CatSchema = SchemaFactory.createForClass(Cat)

@ObjectType('Cat')
export class ICat extends OutputType(Cat) {}

@ObjectType('CatList')
export class ICatList extends PaginatedOutputType(Cat) {}

@InputType()
export class CatQueryInput extends QueryInputType(Cat) {}
