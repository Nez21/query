import { Schema } from '@nestjs/mongoose'
import { Cat } from './cat'
import { Definition } from 'lib/decorators/definition.decorator'
import { Property } from 'lib/decorators/property.decorator'
import { Reference } from 'lib/decorators/reference.decorator'
import { Decorate } from 'lib/decorators/decorate.decorator'
import { IsEmail } from 'class-validator'
import { ESPropMetadata } from 'lib/adapters/elasticsearch/types'

@Definition()
@Schema()
export class Owner {
   @Property({ name: 'id' })
   _id: string

   @Property<ESPropMetadata>({ metadata: { text: true } })
   name: string

   @Property()
   age: number

   @Property()
   address: string

   @Decorate((each: boolean) => IsEmail({}, { each }), { scope: 'input' })
   @Property<ESPropMetadata>({ metadata: { text: true } })
   email: string

   @Property<ESPropMetadata>({ type: () => String, metadata: { text: true } })
   phoneNumbers: string[]

   @Reference({ type: () => Cat })
   cats: Ref<Cat>[]
}
