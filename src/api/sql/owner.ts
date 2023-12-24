import { Cat } from './cat'
import { Definition } from 'lib/decorators/definition.decorator'
import { Property } from 'lib/decorators/property.decorator'
import { Decorate } from 'lib/decorators/decorate.decorator'
import { IsEmail } from 'class-validator'
import { BaseEntity, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'

@Definition()
@Entity({ name: 'owners' })
export class Owner extends BaseEntity {
   @Property()
   @PrimaryGeneratedColumn('uuid')
   id: string

   @Property()
   @Column({ type: 'varchar' })
   name: string

   @Property()
   @Column({ type: 'smallint' })
   age: number

   @Property()
   @Column({ type: 'text' })
   address: string

   @Decorate((each: boolean) => IsEmail({}, { each }), { scope: 'input' })
   @Property()
   @Column({ type: 'varchar' })
   email: string

   @Property({ type: () => String })
   @Column({ type: 'varchar', array: true })
   phoneNumbers: string[]

   @OneToMany(() => Cat, (cat) => cat.owner)
   cats: Ref<Cat>[]
}
