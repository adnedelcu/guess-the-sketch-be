import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { ChatEntry, ErrorCodes, Room, RoomType } from './schemas/room.schema';
import { Player } from './schemas/player.schema';
import { Server, Socket } from 'socket.io'

@WebSocketGateway({
  cors: {
    origin: '*'
  }
})
export class RoomsGateway {
  @WebSocketServer()
  server: Server

  private readonly rooms:Map<string, RoomType> = new Map();

  @SubscribeMessage('getRoom')
  handleGetRoom(@ConnectedSocket() client: Socket, @MessageBody() payload: any): any {
    const room = this.rooms.get(payload.code);
    if (!room) {
      return { error: true, errorCode: ErrorCodes.RoomNotFound, message: 'Room does not exist' };
    }

    return { error: false, room: this.rooms.get(payload.code)?.toPlain() };
  }

  @SubscribeMessage('getRooms')
  handleGetRooms(@ConnectedSocket() client: Socket, @MessageBody() payload: any): any {
    const rooms = ([...this.rooms.values()]).filter(room => !room.isPrivate).map(room => room.toPlain());

    return { error: false, rooms };
  }

  @SubscribeMessage('createRoom')
  handleCreateRoom(@ConnectedSocket() client: Socket, @MessageBody() payload: any): any {
    console.log(payload);
    this.rooms.set(payload.code, Room.fromObject(payload.room));

    client.join(payload.code);

    return { rooms: this.rooms };
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() payload: any): any {
    if (!this.rooms.has(payload.code)) {
      return { error: true, errorCode: ErrorCodes.RoomNotFound, message: 'Room does not exist' };
    }

    const room = this.rooms.get(payload.code) || new Room();
    if (room.players.size === 0 || room.players.has(payload.player._id)) {
      return { error: true, errorCode: ErrorCodes.PlayerAlreadyInRoom, message: 'Player already in the room' };
    }

    if (room.players.size + 1 >= room.maxPlayers) {
      return { error: true, errorCode: ErrorCodes.MaxPlayersReached, message: 'Room is already full' };
    }

    room.players.set(payload.player._id, Player.fromObject(payload.player));

    client.join(payload.code);
    this.server.to(payload.code).emit('updateRoom', { room: room.toPlain() });

    return { error: false, message: 'Player joined the room' };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() payload: any): any {
    const room = this.rooms.get(payload.code);
    if (!room) {
      return { error: true, errorCode: ErrorCodes.RoomNotFound, message: 'Room does not exist' };
    }

    const player = room.players.get(payload.player._id);
    if (!player) {
      return { error: true, errorCode: ErrorCodes.PlayerNotFound, message: 'Player not found in the room' };
    }

    room.players.delete(player._id);
    if (!room.players.size) {
      this.rooms.delete(room.code);
    } else {
      if (player._id == room.owner._id && room.players.size) {
        room.owner = [...room.players.values()][0];
      }
      this.rooms.set(room.code, room);

      this.server.to(payload.code).emit('updateRoom', { room: room.toPlain() });
    }
    client.leave(payload.code);

    return { error: false, message: 'Player left room' };
  }

  @SubscribeMessage('toggleReady')
  handleToggleReady(@ConnectedSocket() client: Socket, @MessageBody() payload: any): any {
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

    this.server.to(payload.code).emit('updateRoom', { room: room.toPlain() });

    return { error: false, room: room.toPlain(), player };
  }

  @SubscribeMessage('startGame')
  handleStartGame(@ConnectedSocket() client: Socket, @MessageBody() payload: any): any {
    const room = this.rooms.get(payload.code);
    if (!room) {
      return { error: true, errorCode: ErrorCodes.RoomNotFound, message: 'Room does not exist' };
    }

    room.hasStarted = true;
    this.rooms.set(room.code, room);

    this.server.to(payload.code).emit('updateRoom', { room: room.toPlain() });

    return { error: false, room: room.toPlain() };
  }

  @SubscribeMessage('updateRoomCanvas')
  handleUpdateRoomCanvas(@ConnectedSocket() client: Socket, @MessageBody() payload: any): any {
    const room = this.rooms.get(payload.room.code);
    if (!room) {
      return { error: true, errorCode: ErrorCodes.RoomNotFound, message: 'Room does not exist' };
    }

    console.log('updateRoomCanvas', payload);

    room.canvas = payload.canvas;
    this.rooms.set(room.code, room);

    this.server.to(payload.code).emit('updateRoomCanvas', { playerId: payload.playerId, room: room.toPlain() });

    return { error: false, room: room.toPlain() };
  }

  @SubscribeMessage('sendMessage')
  handleSendMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: any): any {
    const room = this.rooms.get(payload.code);
    if (!room) {
      return { error: true, errorCode: ErrorCodes.RoomNotFound, message: 'Room does not exist' };
    }

    console.log('updateChatHistory', payload);

    console.log(room.chatHistory);
    room.chatHistory.push(new ChatEntry(payload.player._id, payload.message || null, new Date(), true, payload.buzz || false));
    console.log(room.chatHistory);
    this.rooms.set(room.code, room);

    this.server.to(payload.code).emit('updateChatHistory', { room });

    return { error: false, room: room.toPlain() };
  }
}
