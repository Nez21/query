import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Definition } from 'lib/decorators/definition.decorator'
import { Property } from 'lib/decorators/property.decorator'
import { Document } from 'mongoose'

@Definition()
@Schema()
export class Vaccination {
   @Property()
   @Prop()
   name: string

   @Property()
   @Prop()
   date: Date
}

export type VaccinationDocument = Vaccination & Document
export const VaccinationSchema = SchemaFactory.createForClass(Vaccination)
