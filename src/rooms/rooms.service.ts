import { Injectable } from '@nestjs/common';
import { Room } from './schemas/room.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class RoomsService {
  constructor(@InjectModel(Room.name) private readonly roomModel: Model<Room>) {}

  create(room: Room) {
    const roomDto = {...room.toPlain(), owner: room.owner._id};

    return this.roomModel.create(roomDto);
  }
}
