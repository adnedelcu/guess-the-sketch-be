import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { Game, GameStage, GameType } from "./game.schema"
import { Player, PlayerType } from "./player.schema"
import mongoose, { HydratedDocument } from "mongoose"

export enum ErrorCodes {
  RoomNotFound = 'room_not_found',
  PlayerAlreadyInRoom = 'player_already_in_room',
  PlayerNotFound = 'player_not_found',
  MaxPlayersReached = "max_players_reached",
}

export type ChatEntryType = {
  playerId: string
  message: string
  date: Date
  delivered: boolean
  buzz: boolean
}

export class ChatEntry implements ChatEntryType {
  playerId: string
  message: string
  date: Date
  delivered: boolean
  buzz: boolean

  constructor(
    playerId: string = '',
    message: string = '',
    date: Date = new Date(),
    delivered: boolean = false,
    buzz: boolean = false,
  ) {
    this.playerId = playerId;
    this.message = message;
    this.date = date;
    this.delivered = delivered;
    this.buzz = buzz;
  }

  static fromObject(chatEntry: any): ChatEntryType {
    return new ChatEntry(
      chatEntry.playerId,
      chatEntry.message,
      chatEntry.date,
      chatEntry.delivered || true,
      chatEntry.buzz || false,
    );
  }
}

export type RoomType = {
  code: string
  name: string
  isPrivate: boolean
  hasStarted: boolean
  isFinished: boolean
  owner: PlayerType
  maxPlayers: number
  timeForDrawing: number
  timeForGuessing: number
  canvas: any
  players: Map<string, PlayerType>
  chatHistory: ChatEntry[]
  game: GameType
  toPlain(): object
}

export type RoomDocument = HydratedDocument<Room>;

@Schema()
export class Room implements RoomType {
  @Prop()
  code: string
  @Prop()
  name: string
  @Prop()
  isPrivate: boolean
  hasStarted: boolean = false
  isFinished: boolean = false
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  owner: PlayerType
  @Prop()
  maxPlayers: number
  @Prop()
  timeForDrawing: number
  @Prop()
  timeForGuessing: number
  canvas: any
  @Prop()
  players: Map<string, PlayerType>
  @Prop()
  chatHistory: ChatEntry[] = []
  @Prop({ type: mongoose.Schema.Types.Map })
  game: GameType

  constructor(
    code: string = '',
    name: string = '',
    isPrivate: boolean = false,
    owner: PlayerType = new Player(),
    maxPlayers: number = 0,
    timeForDrawing: number = 0,
    timeForGuessing: number = 0,
    canvas: any = '',
    players: Map<string, PlayerType> = new Map(),
    chatHistory: ChatEntry[] = [],
    game: GameType = new Game(),
  ) {
    this.code = code
    this.name = name
    this.isPrivate = isPrivate
    this.owner = Player.fromObject(owner)
    this.maxPlayers = maxPlayers
    this.timeForDrawing = timeForDrawing
    this.timeForGuessing = timeForGuessing
    this.canvas = canvas
    this.players = players
    this.chatHistory = chatHistory
    this.game = game
  }

  static fromObject(room: any): RoomType {
    const players = new Map();
    for (let playerId in room.players) {
      players.set(playerId, room.players[playerId]);
    }

    const game = new Game();
    const gameStages = new Map();
    for (let stageId in room.game.stages) {
      gameStages.set(stageId, GameStage.fromObject(room.game.stages[stageId]));
    }
    game.stages = gameStages;
    game.activeStage = room.game.activeStage;

    return new Room(
      room.code,
      room.name,
      room.isPrivate,
      room.owner,
      room.maxPlayers,
      room.timeForDrawing,
      room.timeForGuessing,
      room.canvas,
      players,
      room.chatHistory,
      game,
    );
  }

  toPlain(): object {
    return {
      ...this,
      players: Object.fromEntries(this.players.entries()),
      game: this.game.toPlain(),
    }
  }
}

export const RoomSchema = SchemaFactory.createForClass(Room);
