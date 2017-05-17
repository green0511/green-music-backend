import { model } from 'mongoose'
import { RecommendSchema } from './Recommend.schema'
import { IRecommend } from './Recommend.interface'
export let RecommendModel = model<IRecommend>('Recommend', RecommendSchema)
