import { Vaccination } from './vaccination'
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
import {
   BaseEntity,
   Column,
   Entity,
   ManyToOne,
   OneToMany,
   PrimaryGeneratedColumn,
} from 'typeorm'

@Definition()
@Entity({ name: 'cats' })
export class Cat extends BaseEntity {
   @Property()
   @PrimaryGeneratedColumn('uuid')
   id: string

   @Property()
   @Column({ type: 'varchar' })
   name: string

   @Property()
   @Column({ type: 'varchar' })
   breed: string

   @Property()
   @Column({ type: 'varchar' })
   color: string

   @Property()
   @Column({ type: 'timestamp with time zone' })
   birthDate: Date

   @Reference({ type: () => Owner })
   @ManyToOne(() => Owner, { orphanedRowAction: 'nullify' })
   owner: Ref<Owner>

   @Reference({ type: () => Vaccination })
   @OneToMany(() => Vaccination, (vaccination) => vaccination.cat)
   vaccinations: Vaccination[]
}

@ObjectType('Cat')
export class ICat extends OutputType(Cat) {}

@ObjectType('CatList')
export class ICatList extends PaginatedOutputType(Cat) {}

@InputType()
export class CatQueryInput extends QueryInputType(Cat) {}
