import { Type } from 'class-transformer'
import { Decorate } from 'lib/decorators/decorate.decorator'
import { Property } from 'lib/decorators/property.decorator'
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Vaccination } from './vaccination'
import { Cat } from './cat'
import { Definition } from 'lib/decorators/definition.decorator'
import { Reference } from 'lib/decorators/reference.decorator'
import { Veterinarian } from './veterinarian'

@Definition()
@Entity({ name: 'health_records' })
export class HealthRecord {
   @Property()
   @PrimaryGeneratedColumn('uuid')
   id: string

   @Property()
   @Decorate(Type(() => Date))
   @Column({ type: 'timestamp with time zone' })
   date: Date

   @Property()
   @Column({ type: 'varchar', length: 255, nullable: true })
   medicalCondition: string

   @Property()
   @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
   weight: number

   @Property()
   @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
   temperature: number

   @Property({ filterable: false, sortable: false })
   @Column({ type: 'varchar', nullable: true })
   notes: string

   @Reference({ type: () => Cat })
   @ManyToOne(() => Cat)
   cat: Ref<Cat>

   @Reference({ type: () => Vaccination })
   @ManyToMany(() => Vaccination)
   @JoinTable({ name: 'map_health_record_vaccination' })
   vaccinations: Ref<Vaccination>[]

   @Reference({ type: () => Veterinarian })
   @ManyToOne(() => Veterinarian)
   veterinarian: Ref<Veterinarian>
}
