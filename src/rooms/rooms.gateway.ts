import * as uuid from 'uuid';
import { ConnectedSocket, MessageBody, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { ChatEntry, ErrorCodes, Room, RoomType } from './schemas/room.schema';
import { Player } from './schemas/player.schema';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { Game, GameStage, GameStageType, Stage } from './schemas/game.schema';

@WebSocketGateway({ cors: { origin: '*' } })
export class RoomsGateway implements OnGatewayInit {
  @WebSocketServer()
  private readonly server: Server;

  private readonly rooms: Map<string, RoomType> = new Map();

  private readonly logger: Logger = new Logger('RoomsGateway');

  afterInit(server: Server) {
    this.logger.log('Initialized');
    server.on('connection', (socket) => {
      socket.on('disconnecting', () => {
        for (let roomCode of Array.from(socket.rooms)) {
          if (!this.rooms.has(roomCode)) {
            continue;
          }

          const room = this.rooms.get(roomCode);

          if (!room.hasStarted) {
            const players = Array.from(room.players.values());
            const player = players.find((player: Player) => player.socketId == socket.id);
            if (player) {
              room.players.delete(player._id);
            }
            if (room.owner.socketId == socket.id) {
              room.owner = Object.values(room.players)[0];
              room.owner = Array.from(room.players.values())[0];
            }

            if (room.players.size == 0) {
              this.rooms.delete(roomCode);
            } else {
              server.to(roomCode).emit('updateRoom', { room: room.toPlain() });
            }
          }
          socket.leave(roomCode);
        }
      })
      socket.on('disconnect', () => {
      })
    });
  }

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
    this.logger.log(`Client ${client.id} creates room ${payload.code}.`);
    payload.room.owner.socketId = client.id;
    payload.room.players[payload.room.owner._id].socketId = client.id;
    this.rooms.set(payload.code, Room.fromObject(payload.room));

    client.join(payload.code);
    this.logger.log(`Client ${client.id} created and joined room ${payload.code}.`);

    return { rooms: this.rooms };
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() payload: any): any {
    this.logger.log(`Client ${client.id} joins room ${payload.code}.`);
    if (!this.rooms.has(payload.code)) {
      return { error: true, errorCode: ErrorCodes.RoomNotFound, message: 'Room does not exist' };
    }

    const room = this.rooms.get(payload.code) || new Room();
    if (room.players.size === 0 || room.players.has(payload.player._id)) {
      return { error: true, errorCode: ErrorCodes.PlayerAlreadyInRoom, message: 'Player already in the room' };
    }

    if (room.players.size + 1 > room.maxPlayers) {
      return { error: true, errorCode: ErrorCodes.MaxPlayersReached, message: 'Room is already full' };
    }

    room.players.set(payload.player._id, Player.fromObject({...payload.player, socketId: client.id}));

    client.join(payload.code);
    this.server.to(payload.code).emit('updateRoom', { room: room.toPlain() });
    this.logger.log(`Client ${client.id} joined room ${payload.code}.`);

    return { error: false, message: 'Player joined the room' };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() payload: any): any {
    this.logger.log(`Client ${client.id} leaves room ${payload.code}.`);
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
    this.logger.log(`Client ${client.id} left room ${payload.code}.`);

    return { error: false, message: 'Player left room' };
  }

  @SubscribeMessage('toggleReady')
  handleToggleReady(@ConnectedSocket() client: Socket, @MessageBody() payload: any): any {
    const room = this.rooms.get(payload.code);
    if (!room) {
      return { error: true, errorCode: ErrorCodes.RoomNotFound, message: 'Room does not exist' };
    }

    const player = room.players.get(payload.playerId);
    if (!player) {
      return { error: true, errorCode: ErrorCodes.PlayerNotFound, message: 'Player not found in the room' };
    }

    player.ready = !player.ready;
    room.players.set(player._id, player);
    this.rooms.set(room.code, room);
    this.logger.log(`Client ${client.id} (Player ${player._id}) toggled ready check. Current status:${player.ready ? '' : ' not'} ready`);

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
    room.game = new Game();
    room.game.stages = new Map<string, GameStageType>();
    let prevGameStage = new GameStage(Stage.Draw, room.owner, Game.randomAnimal());
    let prevUuid = uuid.v4();
    room.game.stages.set(prevUuid, prevGameStage);
    let nextStage = Stage.Guess;

    const players = [...room.players.values()];
    for (let i = players.length - 1; i >= 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [players[i], players[j]] = [players[j], players[i]];
    }

    for (const player of players) {
      if (player._id === room.owner._id) {
        continue;
      }
      const newGameStage = new GameStage(nextStage, player);
      const newUuid = uuid.v4();
      prevGameStage.nextStage = newUuid;
      room.game.stages.set(prevUuid, prevGameStage);
      room.game.stages.set(newUuid, newGameStage);
      nextStage = nextStage == Stage.Guess ? Stage.Draw : Stage.Guess;
      prevGameStage = newGameStage;
      prevUuid = newUuid;
    }
    room.game.activeStage = [...room.game.stages.keys()][0];
    console.log(room, room.toPlain());
    this.rooms.set(room.code, room);

    this.server.to(payload.code).emit('updateRoom', { room: room.toPlain() });

    return { error: false, room: room.toPlain() };
  }

  @SubscribeMessage('updateRoomCanvas')
  handleUpdateRoomCanvas(@ConnectedSocket() client: Socket, @MessageBody() payload: any): any {
    const room = this.rooms.get(payload.code);
    if (!room) {
      return { error: true, errorCode: ErrorCodes.RoomNotFound, message: 'Room does not exist' };
    }

    room.canvas = payload.canvas;
    this.rooms.set(room.code, room);

    this.server.to(payload.code).emit('updateRoomCanvas', { playerId: payload.playerId, room: room.toPlain() });

    return { error: false, room: room.toPlain() };
  }

  @SubscribeMessage('advanceStage')
  handleAdvanceStage(@ConnectedSocket() client: Socket, @MessageBody() payload: any): any {
    const room = this.rooms.get(payload.code);
    if (!room) {
      return { error: true, errorCode: ErrorCodes.RoomNotFound, message: 'Room does not exist' };
    }

    const currentStage = room.game.stages.get(room.game.activeStage);
    console.log(currentStage);
    if (payload.guess) {
      currentStage.word = payload.guess;
      room.game.stages.set(room.game.activeStage, currentStage);
      this.rooms.set(payload.code, room);
    }
    if (payload.canvas) {
      currentStage.canvas = payload.canvas;
      room.game.stages.set(room.game.activeStage, currentStage);
      this.rooms.set(payload.code, room);
    }
    console.log(currentStage);

    if (!currentStage.nextStage) {
      room.isFinished = true;
      this.rooms.set(payload.code, room);

      this.server.to(payload.code).emit('updateRoom', { room: room.toPlain() });

      setTimeout(() => {
        this.server.of('/').adapter.rooms.delete(payload.code);
        this.rooms.delete(payload.code);


      }, 60000);

      return { error: false, room: room.toPlain() };
    }

    room.game.activeStage = currentStage.nextStage;
    const activeStage = room.game.stages.get(room.game.activeStage);
    if (payload.guess) {
      activeStage.word = currentStage.word;
      room.game.stages.set(room.game.activeStage, activeStage);
      this.rooms.set(payload.code, room);
    }
    if (payload.canvas) {
      activeStage.canvas = currentStage.canvas;
      room.game.stages.set(room.game.activeStage, activeStage);
      this.rooms.set(payload.code, room);
    }

    this.server.to(payload.code).emit('updateRoom', { room: room.toPlain() });

    return { error: false, room: room.toPlain() };
  }

  @SubscribeMessage('sendMessage')
  handleSendMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: any): any {
    this.logger.log(`Client ${client.id} sending "${!payload.buzz ? ` message ${payload.message}` : 'buzz'}" to room ${payload.code}.`);
    const room = this.rooms.get(payload.code);
    if (!room) {
      return { error: true, errorCode: ErrorCodes.RoomNotFound, message: 'Room does not exist' };
    }

    room.chatHistory.push(new ChatEntry(payload.player._id, payload.message || null, new Date(), true, payload.buzz || false));
    this.rooms.set(room.code, room);

    this.server.to(payload.code).emit('updateChatHistory', { room });
    this.logger.log(`Client ${client.id} sending "${!payload.buzz ? ` message ${payload.message}` : 'buzz'}" to room ${payload.code}.`);

    return { error: false, room: room.toPlain() };
  }
}
