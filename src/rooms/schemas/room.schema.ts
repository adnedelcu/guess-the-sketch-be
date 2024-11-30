import { Player, PlayerType } from "./player.schema"

export enum ErrorCodes {
  RoomNotFound = 'room_not_found',
  PlayerAlreadyInRoom = 'player_already_in_room',
  PlayerNotFound = 'player_not_found',
}

export type RoomType = {
  code: string
  name: string
  isPrivate: boolean
  owner: PlayerType
  maxPlayers: number
  players: Map<string, PlayerType>
  toPlain(): object
}

export class Room implements RoomType {
  code: string
  name: string
  isPrivate: boolean
  owner: PlayerType
  maxPlayers: number
  players: Map<string, PlayerType>

  constructor(
    code: string = '',
    name: string = '',
    isPrivate: boolean = false,
    owner: PlayerType = new Player(),
    maxPlayers: number = 0,
    players: Map<string, PlayerType> = new Map()
  ) {
    this.code = code
    this.name = name
    this.isPrivate = isPrivate
    this.owner = owner
    this.maxPlayers = maxPlayers
    this.players = players
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
      players,
    );
  }

  toPlain(): object {
    return {
      ...this,
      players: Object.fromEntries(this.players.entries())
    }
  }
}
