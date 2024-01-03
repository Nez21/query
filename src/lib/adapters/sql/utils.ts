import { LIST_OPERATORS, ListOperator } from 'lib/constants'
import { RelationMetadata } from 'typeorm/metadata/RelationMetadata'

export const getJoinCondition = (
   alias: string,
   relationAlias: string,
   relation: RelationMetadata,
) => {
   if (relation.isManyToOne || relation.isOneToOneOwner) {
      return relation.joinColumns
         .map((joinColumn) => {
            const sourceColumn = `${alias}.${joinColumn.propertyName}`
            const targetColumn = `${relationAlias}.${joinColumn.referencedColumn.propertyName}`
            return `${sourceColumn} = ${targetColumn}`
         })
         .join(' AND ')
   }

   if (relation.isOneToMany || relation.isOneToOneNotOwner) {
      return relation.inverseRelation.joinColumns
         .map((joinColumn) => {
            const sourceColumn = `${alias}.${joinColumn.referencedColumn.propertyName}`
            const targetColumn = `${relationAlias}.${joinColumn.propertyName}`
            return `${sourceColumn} = ${targetColumn}`
         })
         .join(' AND ')
   }

   return relation.joinColumns
      .map((joinColumn) => {
         const sourceColumn = `${alias}.${joinColumn.referencedColumn.propertyName}`
         const targetColumn = `${relation.joinTableName}.${joinColumn.propertyName}`
         return `${sourceColumn} = ${targetColumn}`
      })
      .concat(
         relation.inverseJoinColumns.map((joinColumn) => {
            const sourceColumn = `${relation.joinTableName}.${joinColumn.propertyName}`
            const targetColumn = `${relationAlias}.${joinColumn.referencedColumn.propertyName}`
            return `${sourceColumn} = ${targetColumn}`
         }),
      )
      .join(' AND ')
}

export const extractRelationFilter = (
   filter: AnyObject,
   key: string,
): { value: AnyObject; listOperator?: ListOperator } => {
   const value = filter[key]
   const listOperator = value ? LIST_OPERATORS.find((el) => el in value) : null
   delete filter[key]

   if (listOperator) {
      return { value: Object.values(value)[0], listOperator }
   }

   return { value, listOperator }
}
