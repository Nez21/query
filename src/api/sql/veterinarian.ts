import { Definition } from 'lib/decorators/definition.decorator'
import { Property } from 'lib/decorators/property.decorator'
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Definition()
@Entity({ name: 'veterinarians' })
export class Veterinarian {
   @Property()
   @PrimaryGeneratedColumn('uuid')
   id: number

   @Property()
   @Column({ type: 'varchar' })
   name: string

   @Property()
   @Column({ type: 'varchar' })
   gender: string

   @Property()
   @Column({ type: 'varchar' })
   email: string

   @Property({ type: () => String })
   @Column({ type: 'varchar', array: true })
   phoneNumbers: string[]

   @Property()
   @Column({ type: 'varchar' })
   address: string

   @Property()
   @Column({ type: 'varchar' })
   licenseNumber: string
}
