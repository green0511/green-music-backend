import { Schema } from 'mongoose'
export const UserSubSchema = new Schema({
  _id: String,
  username: {
    type: String,
    required: true
  }
})