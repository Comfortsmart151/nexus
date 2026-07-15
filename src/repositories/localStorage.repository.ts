export class LocalStorageRepository {
  static get<T>(key: string): T | null {
    if (typeof window === "undefined") return null;

    const data = localStorage.getItem(key);

    if (!data) return null;

    return JSON.parse(data);
  }

  static save<T>(key: string, value: T) {
    if (typeof window === "undefined") return;

    localStorage.setItem(key, JSON.stringify(value));
  }

  static remove(key: string) {
    if (typeof window === "undefined") return;

    localStorage.removeItem(key);
  }
}