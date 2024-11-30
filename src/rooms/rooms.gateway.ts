import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { ErrorCodes, Room, RoomType } from './schemas/room.schema';
import { Player, PlayerType } from './schemas/player.schema';
import { Server } from 'http';

@WebSocketGateway({
  cors: {
    origin: '*'
  }
})
export class RoomsGateway {
  @WebSocketServer()
  server: Server

  private readonly rooms:Map<string, RoomType> = new Map();

  @SubscribeMessage('createRoom')
  handleCreateRoom(client: any, payload: any): any {
    this.rooms.set(payload.code, Room.fromObject(payload.room));

    return { rooms: this.rooms };
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: any, payload: any): any {
    if (!this.rooms.has(payload.code)) {
      return { error: true, errorCode: ErrorCodes.RoomNotFound, message: 'Room does not exist' };
    }

    const room = this.rooms.get(payload.code) || new Room();
    if (room.players.size === 0 || room.players.has(payload.player._id)) {
      return { error: true, errorCode: ErrorCodes.PlayerAlreadyInRoom, message: 'Player already in the room' };
    }

    room.players.set(payload.player._id, Player.fromObject(payload.player));

    this.server.emit('updateRoom', { room });

    return { error: false, message: 'Player joined the room' };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(client: any, payload: any): any {
    const room = this.rooms.get(payload.code);
    if (!room) {
      return { error: true, errorCode: ErrorCodes.RoomNotFound, message: 'Room does not exist' };
    }

    const player = room.players.get(payload.player._id);
    if (!player) {
      return { error: true, errorCode: ErrorCodes.PlayerNotFound, message: 'Player not found in the room' };
    }

    room.players.delete(player._id);
    this.rooms.set(room.code, room);

    this.server.emit('updateRoom', { room });

    return { error: false, message: 'Player left room' };
  }

  @SubscribeMessage('getRoom')
  handleGetRoom(client: any, payload: any): any {
    const room = this.rooms.get(payload.code);
    if (!room) {
      return { error: true, errorCode: ErrorCodes.RoomNotFound, message: 'Room does not exist' };
    }

    return { error: false, room: this.rooms.get(payload.code)?.toPlain() };
  }

  @SubscribeMessage('getRooms')
  handleGetRooms(client: any, payload: any): any {
    const rooms = ([...this.rooms.values()]).filter(room => !room.isPrivate).map(room => room.toPlain());

    return { error: false, rooms };
  }

  @SubscribeMessage('toggleReady')
  handleToggleReady(client: any, payload: any): any {
    const room = this.rooms.get(payload.room.code);
    if (!room) {
      return { error: true, errorCode: ErrorCodes.RoomNotFound, message: 'Room does not exist' };
    }

    const player = room.players.get(payload.player._id);
    if (!player) {
      return { error: true, errorCode: ErrorCodes.PlayerNotFound, message: 'Player not found in the room' };
    }

    player.ready = !player.ready;
    room.players.set(player._id, player);
    this.rooms.set(room.code, room);

    this.server.emit('updateRoom', { room: room.toPlain() });

    return { error: false, room: room.toPlain(), player };
  }

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    return 'Hello world!';
  }
}
