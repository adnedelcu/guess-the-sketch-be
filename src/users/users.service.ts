import { Injectable } from '@nestjs/common';
import { User } from './schemas/user.schema';
import { DeleteResult, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { RegisterDto } from '../dto/register.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {};

  async findAll(): Promise<User[]> {
    return await this.userModel.find().exec();
  }

  async findById(id: string): Promise<User> {
    return await this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<User> {
    return await this.userModel.findOne({ email: email }).exec();
  }

  async create(registerDto: RegisterDto): Promise<User> {
    return await this.userModel.create(registerDto);
  }

  async destroy(id: string): Promise<DeleteResult> {
    return await this.userModel.deleteOne({ _id: id });
  }
}
