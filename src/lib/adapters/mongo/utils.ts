import { Transform } from 'class-transformer'
import { Decorate } from 'lib/decorators/decorate.decorator'
import { Types } from 'mongoose'

export const ExposeObjectId = Decorate(
   Transform(({ obj, key }) => {
      const isArray = Array.isArray(obj[key])
      const value: (string | Types.ObjectId)[] = isArray ? obj[key] : [obj[key]]
      const result = value.map((el) =>
         typeof el == 'string' ? new Types.ObjectId(el) : el,
      )

      return isArray ? result : result[0]
   }),
)
