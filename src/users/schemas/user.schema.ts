import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Exclude } from 'class-transformer';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop({ type: String, required: true})
  firstName: string;

  @Prop({ type: String, required: true})
  lastName: string;

  @Prop({ type: String, required: true, unique: true})
  email: string;

  @Prop({ type: Date, required: true})
  birthday: Date;

  @Exclude()
  @Prop({ type: String, required: true})
  password: string;

  @Prop({ type: String, required: false})
  profilePicture?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
