import { Game, GameType } from "./game.schema"
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

  static fromObject(chatEntry): ChatEntryType {
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
  owner: PlayerType
  maxPlayers: number
  canvas: any
  players: Map<string, PlayerType>
  chatHistory: ChatEntry[]
  game: GameType
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
  game: GameType

  constructor(
    code: string = '',
    name: string = '',
    isPrivate: boolean = false,
    owner: PlayerType = new Player(),
    maxPlayers: number = 0,
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
      gameStages.set(stageId, room.game.stages[stageId]);
    }
    game.stages = gameStages;
    game.activeStage = room.game.activeStage;

    return new Room(
      room.code,
      room.name,
      room.isPrivate,
      room.owner,
      room.maxPlayers,
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
      game: Game.fromObject(this.game),
    }
  }
}
