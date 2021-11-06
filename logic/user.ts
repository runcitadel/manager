import KeyvRedis from '@keyv/redis';
import Keyv from 'keyv';
import bcrypt from '@node-rs/bcrypt';
import {generateJwt, getIdFromJwt} from '../utils/jwt.js';
import * as consts from '../utils/const.js';

export enum Permission {
  OPEN_CHANNEL,
  CLOSE_CHANNEL,
  INSTALL_APP,
  ADMIN,
}

export type UserData = {
  name: string;
  permissions: Permission[];
  onChainBalance: string;
  lightningBalance: string;
  password: string;
  installedApps: string[];
};

const keyvRedis = new KeyvRedis({
  port: consts.REDIS_PORT,
  host: consts.REDIS_IP,
  db: 0,
  password: consts.REDIS_PASSWORD,
});
const keyv = new Keyv({store: keyvRedis});

export default class User {
  /**
   * Get an user by their id.
   */
  static async get(id: string): Promise<User> {
    const data = await keyv.get(id);
    if (!data) throw new Error('User not found');
    return new User(id);
  }

  /**
   * Creates a new user.
   */
  static async create(
    id: string,
    name: string,
    permissions: Permission[],
    password: string,
  ) {
    // Fail if the id is users or admin
    if (id === 'users' || id === 'admin') throw new Error('Id is not allowed');
    // Fail if the user already exists
    if (await keyv.get(id)) throw new Error('User already exists');
    // Create a new instance of the user object
    const user = new User(id);
    // And initialize it in the database
    // Even though #setData is a private function, it's accessible inside static methods
    // of the class, so it's safe to call it here
    await user.#setData({
      name,
      permissions,
      onChainBalance: '0',
      lightningBalance: '0',
      password: await bcrypt.hash(password, 10),
      installedApps: [],
    });
    // Store the users in the users key
    await keyv.set(
      'users',
      ((await keyv.get('users')) ?? '').split(',').concat(id).join(','),
    );
    return user;
  }

  /**
   * Lists all users on the system.
   */
  static async listUsers(): Promise<string[]> {
    return ((await keyv.get('users')) ?? '').split(',');
  }

  /**
   * Tries to login a user with either their password or a valid JWT.
   */
  static async login(
    type: 'password' | 'jwt',
    id: string | undefined,
    password: string,
  ): Promise<User> {
    switch (type) {
      case 'password': {
        if (!id) throw new Error('No id provided');
        const user = await User.get(id);
        const data = await user.getData();
        if (!(await bcrypt.compare(password, data.password)))
          throw new Error('Invalid password');
        return user;
      }

      case 'jwt': {
        // Get the user's id from the jwt
        // This function throws an error if the jwt is invalid
        const userId = await getIdFromJwt(password);
        // Get the user's data
        return User.get(userId);
      }

      default:
        throw new Error('Invalid login type');
    }
  }

  constructor(public id: string) {}

  async hasPermission(permission: Permission): Promise<boolean> {
    return (await this.getData()).permissions.includes(permission);
  }

  /**
   * Gets the user's full data from the database.
   */
  async getData(): Promise<UserData> {
    const data = await keyv.get(this.id);
    if (!data) throw new Error('User not found');
    return (await JSON.parse(data)) as UserData;
  }

  /**
   * Sets the user's data in the database.
   */
  async #setData(data: UserData) {
    await keyv.set(this.id, JSON.stringify(data));
  }

  /**
   * Generates a JWT for the user.
   * @returns Generated JWT
   */
  async getJwt(): Promise<string> {
    return generateJwt(this.id);
  }

  /**
   * Deletes an user's account.
   */
  async delete() {
    // Remove the user from the users key
    await keyv.set(
      'users',
      ((await keyv.get('users')) ?? '')
        .split(',')
        .filter((id) => id !== this.id)
        .join(','),
    );
    // Delete the user's data
    await keyv.delete(this.id);
  }

  async #setProperty(property: string, value: string | number) {
    const data = {...(await this.getData()), [property]: value};
    await this.#setData(data);
  }

  async getName() {
    return (await this.getData()).name;
  }

  async setName(name: string) {
    await this.#setProperty('name', name);
  }

  async getOnChainBalance() {
    return (await this.getData()).onChainBalance;
  }

  async setOnChainBalance(balance: string | number | bigint) {
    await this.#setProperty('onChainBalance', balance.toString());
  }

  async incrementOnChainBalance(amount: string | number | bigint) {
    await this.#setProperty(
      'onChainBalance',
      (
        BigInt((await this.getData()).onChainBalance) + BigInt(amount)
      ).toString(),
    );
  }

  async decrementOnChainBalance(amount: string | number | bigint) {
    await this.#setProperty(
      'onChainBalance',
      (
        BigInt((await this.getData()).onChainBalance) - BigInt(amount)
      ).toString(),
    );
  }

  async getLightningBalance() {
    return (await this.getData()).lightningBalance;
  }

  async setLightningBalance(balance: string | number | bigint) {
    await this.#setProperty('lightningBalance', balance.toString());
  }

  async incrementLightningBalance(amount: string | number | bigint) {
    await this.#setProperty(
      'lightningBalance',
      (
        BigInt((await this.getData()).lightningBalance) + BigInt(amount)
      ).toString(),
    );
  }

  async decrementLightningBalance(amount: string | number | bigint) {
    await this.#setProperty(
      'lightningBalance',
      (
        BigInt((await this.getData()).lightningBalance) - BigInt(amount)
      ).toString(),
    );
  }

  async addPermission(permission: Permission) {
    const data = {
      ...(await this.getData()),
      permissions: [...(await this.getData()).permissions, permission],
    };
    await this.#setData(data);
  }

  async removePermission(permission: Permission) {
    const data = {
      ...(await this.getData()),
      permissions: (await this.getData()).permissions.filter(
        (p) => p !== permission,
      ),
    };
    await this.#setData(data);
  }

  async changePassword(newPassword: string) {
    const data = {
      ...(await this.getData()),
      password: await bcrypt.hash(newPassword, 10),
    };
    await this.#setData(data);
  }

  async validatePassword(password: string) {
    return bcrypt.compare(password, (await this.getData()).password);
  }
}
