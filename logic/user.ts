import KeyvRedis from "@keyv/redis";
import Keyv from "keyv";

export type Permission =
  | "openChannel"
  | "closeChannels"
  | "installApps"
  | "manageUsers";

export type UserData = {
  name: string;
  permissions: Permission[];
  onChainBalance: string;
  lightningBalance: string;
};

const keyvRedis = new KeyvRedis({
  port: 6379,
  host: "localhost",
  db: 0,
  password: "",
});
const keyv = new Keyv({ store: keyvRedis });

export default class User {
  id: string;

  constructor(id: string) {
    this.id = id;
  }

  async hasPermission(permission: Permission): Promise<boolean> {
    return (await this.#getData()).permissions.includes(permission);
  }

  /**
   * Gets the user's full data from the database.
   */
  async #getData(): Promise<UserData> {
    const data = await keyv.get(this.id);
    if (!data) throw new Error("User not found");
    return (await JSON.parse(data)) as UserData;
  }

  /**
   * Sets the user's data in the database.
   */
  async #setData(data: UserData) {
    await keyv.set(this.id, JSON.stringify(data));
  }

  static async get(id: string): Promise<User> {
    const data = await keyv.get(id);
    if (!data) throw new Error("User not found");
    return new User(id);
  }

  static async create(id: string, name: string, permissions: Permission[]) {
    // Fail if the user already exists
    if (await keyv.get(id)) throw new Error("User already exists");
    // Create a new instance of the user object
    const user = new User(id);
    // And initialize it in the database
    // Even though #setData is a private function, it's accessible inside static methods
    // of the class, so it's safe to call it here
    await user.#setData({
      name,
      permissions,
      onChainBalance: "0",
      lightningBalance: "0",
    });
    return user;
  }

  async #setProperty(property: string, value: string | number) {
    const data = { ...(await this.#getData()), [property]: value };
    await this.#setData(data);
  }

  async getName() {
    return (await this.#getData()).name;
  }

  async setName(name: string) {
    await this.#setProperty("name", name);
  }

  async getOnChainBalance() {
    return (await this.#getData()).onChainBalance;
  }

  async setOnChainBalance(balance: string | number | bigint) {
    await this.#setProperty("onChainBalance", balance.toString());
  }

  async incrementOnChainBalance(amount: string | number | bigint) {
    await this.#setProperty("onChainBalance", (BigInt((await this.#getData()).onChainBalance) + BigInt(amount)).toString());
  }

  async decrementOnChainBalance(amount: string | number | bigint) {
    await this.#setProperty("onChainBalance", (BigInt((await this.#getData()).onChainBalance) - BigInt(amount)).toString());
  }

  async getLightningBalance() {
    return (await this.#getData()).lightningBalance;
  }

  async setLightningBalance(balance: string | number | bigint) {
    await this.#setProperty("lightningBalance", balance.toString());
  }

  async incrementLightningBalance(amount: string | number | bigint) {
    await this.#setProperty("lightningBalance", (BigInt((await this.#getData()).lightningBalance) + BigInt(amount)).toString());
  }

  async decrementLightningBalance(amount: string | number | bigint) {
    await this.#setProperty("lightningBalance", (BigInt((await this.#getData()).lightningBalance) - BigInt(amount)).toString());
  }

  async addPermission(permission: Permission) {
    const data = { ...(await this.#getData()), permissions: [...(await this.#getData()).permissions, permission] };
    await this.#setData(data);
  }

  async removePermission(permission: Permission) {
    const data = { ...(await this.#getData()), permissions: (await this.#getData()).permissions.filter((p) => p !== permission) };
    await this.#setData(data);
  }
}
