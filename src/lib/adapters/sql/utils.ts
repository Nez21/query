import { RelationMetadata } from 'typeorm/metadata/RelationMetadata'

export const getJoinCondition = (
   alias: string,
   relationAlias: string,
   relation: RelationMetadata,
) => {
   return (
      relation.joinColumns.length
         ? relation.joinColumns.map((joinColumn) => {
              const sourceColumn = `${alias}.${joinColumn.givenDatabaseName}`
              const targetColumn = `${relationAlias}.${joinColumn.referencedColumn.propertyName}`
              return `${sourceColumn} = ${targetColumn}`
           })
         : relation.inverseRelation.joinColumns.map((joinColumn) => {
              const sourceColumn = `${alias}.${joinColumn.referencedColumn.propertyName}`
              const targetColumn = `${relationAlias}.${joinColumn.givenDatabaseName}`
              return `${sourceColumn} = ${targetColumn}`
           })
   ).join(' AND ')
}
