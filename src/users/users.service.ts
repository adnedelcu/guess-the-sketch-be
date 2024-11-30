import { Injectable } from '@nestjs/common';
import { User, UserDocument } from './schemas/user.schema';
import { DeleteResult, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { RegisterDto } from '../dto/register.dto';
import { hashSync } from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<User>) {};

  async findAll(): Promise<UserDocument[]> {
    return await this.userModel.find().exec();
  }

  async findById(id: string): Promise<UserDocument> {
    return await this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<UserDocument> {
    return await this.userModel.findOne({ email: email }).exec();
  }

  async create(registerDto: RegisterDto): Promise<UserDocument> {
    registerDto = {...registerDto, password: hashSync(registerDto.password, 10) };

    return await this.userModel.create(registerDto);
  }

  async destroy(id: string): Promise<DeleteResult> {
    return await this.userModel.deleteOne({ _id: id });
  }
}
