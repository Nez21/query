import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Definition } from 'lib/decorators/definition.decorator'
import { Property } from 'lib/decorators/property.decorator'
import { Document, Types } from 'mongoose'
import { Decorate } from 'lib/decorators/decorate.decorator'
import { IsEmail } from 'class-validator'
import { ExposeObjectId } from 'lib/adapters/mongo/utils'

@Definition()
@Schema()
export class Owner {
   @ExposeObjectId
   @Property({ name: 'id', type: () => String })
   @Prop({ type: Types.ObjectId })
   _id: Types.ObjectId

   @Property()
   @Prop()
   name: string

   @Property()
   @Prop()
   age: number

   @Property()
   @Prop()
   address: string

   @Decorate((each: boolean) => IsEmail({}, { each }), { scope: 'input' })
   @Property()
   @Prop()
   email: string

   @Property({ type: () => String })
   @Prop({ type: [String] })
   phoneNumbers: string[]
}

export type OwnerDocument = Owner & Document
export const OwnerSchema = SchemaFactory.createForClass(Owner)
