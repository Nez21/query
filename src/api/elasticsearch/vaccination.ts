import { Schema } from '@nestjs/mongoose'
import { ESPropMetadata } from 'lib/adapters/elasticsearch/types'
import { Definition } from 'lib/decorators/definition.decorator'
import { Property } from 'lib/decorators/property.decorator'

@Definition()
@Schema()
export class Vaccination {
   @Property<ESPropMetadata>({ metadata: { text: true } })
   name: string

   @Property()
   date: Date
}
