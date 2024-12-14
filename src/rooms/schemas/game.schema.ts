import { Player, PlayerType } from "./player.schema"

const animals: string[] = [
  "alligator",
  "anteater",
  "armadillo",
  "badger",
  "bat",
  "bear",
  "beaver",
  "buffalo",
  "camel",
  "chameleon",
  "cheetah",
  "chipmunk",
  "chinchilla",
  "chupacabra",
  "coyote",
  "crow",
  "dinosaur",
  "dog",
  "dolphin",
  "dragon",
  "duck",
  "elephant",
  "fox",
  "frog",
  "giraffe",
  "goose",
  "grizzly",
  "hamster",
  "hedgehog",
  "hippo",
  "hyena",
  "jackal",
  "iguana",
  "kangaroo",
  "kiwi",
  "koala",
  "kraken",
  "leopard",
  "liger",
  "lion",
  "llama",
  "monkey",
  "moose",
  "nyan cat",
  "orangutan",
  "otter",
  "panda",
  "penguin",
  "platypus",
  "python",
  "pumpkin",
  "quagga",
  "quokka",
  "rabbit",
  "raccoon",
  "rhino",
  "sheep",
  "skunk",
  "squirrel",
  "tiger",
  "turtle",
  "unicorn",
  "walrus",
  "wolf",
];

const actions: string[] = [
  "drawing",
  "eating",
  "singing",
  "walking on",
];

const objects: string[] = [
  "apple",
  "bottle of lotion",
  "blowdryer",
  "bracelet",
  "bread",
  "card",
  "cell phone",
  "coffee mug",
  "cowboy hat",
  "guitar",
  "jump rope",
  "mobile phone",
  "pants",
  "paper",
  "pencil",
  "ring",
  "rubber gloves",
  "scotch tape",
  "sketch pad",
  "sticky note",
];

export enum Stage {
  Draw = 'draw',
  Guess = 'guess',
}

export type GameStageType = {
  stage: Stage,
  player: PlayerType,
  ttl: number,
  word: string,
  canvas: string,
  nextStage?: string;
}

export class GameStage implements GameStageType {
  stage: Stage;
  player: PlayerType;
  ttl: number;
  word: string;
  canvas: string;
  nextStage?: string;

  constructor(
    stage: Stage,
    player: PlayerType,
    ttl: number = 0,
    word: string = '',
    canvas: string = '',
    nextStage: string|undefined = '',
  ) {
    this.stage = stage;
    this.player = player;
    this.ttl = ttl;
    this.word = word;
    this.canvas = canvas;
    this.nextStage = nextStage;
  }

  static fromObject(gameStage: any): GameStage {
    return new GameStage(
      gameStage.stage,
      gameStage.player instanceof Player ? gameStage.player : Player.fromObject(gameStage.player),
      gameStage.ttl,
      gameStage.word,
      gameStage.canvas,
      gameStage.nextStage,
    );
  }
}

export type GameType = {
  stages: Map<string, GameStageType>,
  activeStage?: string,
  toPlain(): object;
}

export class Game implements GameType {
  stages: Map<string, GameStageType> = new Map();
  activeStage?: string;

  static fromObject(gameObj: GameType) {
    const game = new Game();
    const stages = new Map<string, GameStageType>();
    for (const stageId in gameObj.stages) {
      stages.set(stageId, GameStage.fromObject(gameObj.stages[stageId]));
    }
    game.stages = stages;
    game.activeStage = gameObj.activeStage;

    return game;
  }

  static randomAnimal(): string {
    return animals[Math.floor(Math.random() * animals.length)];
  }

  static randomAction(): string {
    return actions[Math.floor(Math.random() * actions.length)];
  }

  static randomObject(): string {
    return objects[Math.floor(Math.random() * objects.length)];
  }

  static randomSentence(): string {
    const animal = this.randomAnimal();
    const action = this.randomAction();
    const object = this.randomObject();

    return `${animal} ${action} ${object[0] == 'a' ? `an ${object}` : `a ${object}`}`;
  }

  toPlain(): object {
    return {
      stages: Object.fromEntries(this.stages.entries()),
      activeStage: this.activeStage,
    }
  }
}
