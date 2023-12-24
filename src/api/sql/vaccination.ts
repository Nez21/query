import { Decorate } from 'lib/decorators/decorate.decorator'
import { Cat } from './cat'
import { Definition } from 'lib/decorators/definition.decorator'
import { Property } from 'lib/decorators/property.decorator'
import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Type } from 'class-transformer'

@Definition()
@Entity({ name: 'vaccinations' })
export class Vaccination extends BaseEntity {
   @Property()
   @PrimaryGeneratedColumn('uuid')
   id: string

   @Property()
   @Column({ type: 'varchar' })
   name: string

   @Property()
   @Decorate(Type(() => Date), { scope: 'output' })
   @Column({ type: 'timestamp with time zone' })
   date: Date

   @ManyToOne(() => Cat)
   cat: Ref<Cat>
}
