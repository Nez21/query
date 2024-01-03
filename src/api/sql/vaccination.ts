import { Definition } from 'lib/decorators/definition.decorator'
import { Property } from 'lib/decorators/property.decorator'
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Definition()
@Entity({ name: 'vaccinations' })
export class Vaccination {
   @Property()
   @PrimaryGeneratedColumn('uuid')
   id: string

   @Property()
   @Column({ type: 'varchar' })
   name: string
}
