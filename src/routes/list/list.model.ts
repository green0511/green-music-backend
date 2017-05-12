import { model } from 'mongoose'
import { ListSchema } from './List.schema'
import { IList } from './List.interface'
export let ListModel = model<IList>('List', ListSchema)
