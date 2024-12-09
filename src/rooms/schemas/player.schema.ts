export type PlayerType = {
  _id: string
  socketId: string,
  firstName: string
  lastName: string
  email: string
  birthday: Date
  ready: boolean
}

export class Player implements PlayerType {
  _id: string
  socketId: string
  firstName: string
  lastName: string
  email: string
  birthday: Date
  ready: boolean

  constructor(
    _id: string = '',
    socketId: string = '',
    firstName: string = '',
    lastName: string = '',
    email: string = '',
    birthday: Date = new Date(),
    ready: boolean = false,
  ) {
    this._id = _id;
    this.socketId = socketId;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.birthday = birthday;
    this.ready = ready;
  }

  static fromObject(player: any): PlayerType {
    return new Player(
      player._id,
      player.socketId,
      player.firstName,
      player.lastName,
      player.email,
      player.birthday,
      player.ready,
    );
  }
}
