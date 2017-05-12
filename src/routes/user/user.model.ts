import { Schema, model } from 'mongoose'
import { IUser } from './User.interface'
import { UserSchema } from './User.schema'

export const UserModel = model<IUser>('User', UserSchema)
