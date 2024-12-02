import { Player, PlayerType } from "./player.schema"

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
}

export class ChatEntry implements ChatEntryType {
  playerId: string
  message: string
  date: Date
  delivered: boolean

  constructor(
    playerId: string = '',
    message: string = '',
    date: Date = new Date(),
    delivered: boolean = false,
  ) {
    this.playerId = playerId;
    this.message = message;
    this.date = date;
    this.delivered = delivered;
  }

  static fromObject(chatEntry): ChatEntryType {
    return new ChatEntry(
      chatEntry.playerId,
      chatEntry.message,
      chatEntry.date,
      chatEntry.delivered || true,
    );
  }
}

export type RoomType = {
  code: string
  name: string
  isPrivate: boolean
  hasStarted: boolean
  owner: PlayerType
  maxPlayers: number
  canvas: any
  players: Map<string, PlayerType>
  chatHistory: ChatEntry[]
  toPlain(): object
}

export class Room implements RoomType {
  code: string
  name: string
  isPrivate: boolean
  hasStarted: boolean = false
  owner: PlayerType
  maxPlayers: number
  canvas: any
  players: Map<string, PlayerType>
  chatHistory: ChatEntry[] = []

  constructor(
    code: string = '',
    name: string = '',
    isPrivate: boolean = false,
    owner: PlayerType = new Player(),
    maxPlayers: number = 0,
    canvas: any = '',
    players: Map<string, PlayerType> = new Map(),
    chatHistory: ChatEntry[] = [],
  ) {
    this.code = code
    this.name = name
    this.isPrivate = isPrivate
    this.owner = owner
    this.maxPlayers = maxPlayers
    this.canvas = canvas
    this.players = players
    this.chatHistory = chatHistory
  }

  static fromObject(room: any): RoomType {
    const players = new Map();
    for (let playerId in room.players) {
      players.set(playerId, room.players[playerId]);
    }

    return new Room(
      room.code,
      room.name,
      room.isPrivate,
      room.owner,
      room.maxPlayers,
      room.canvas,
      players,
      room.chatHistory,
    );
  }

  toPlain(): object {
    return {
      ...this,
      players: Object.fromEntries(this.players.entries())
    }
  }
}
