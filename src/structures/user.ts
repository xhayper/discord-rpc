export class User {
  id: string = '';
  username: string = '';
  discriminator: string = '';
  avatar: string = '';
  bot: boolean = false;
  flags: number = 0;
  premium_type: number = 0;

  constructor(props: object) {
    Object.assign(this, props);
  }

  get tag() {
    return `${this.username}#${this.discriminator}`;
  }
}
