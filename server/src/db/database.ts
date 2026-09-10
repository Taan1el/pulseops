import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { SCHEMA_SQL } from './schema.js'

export class Database {
  private db: DatabaseSync

  constructor(location: string = ':memory:') {
    if (location !== ':memory:') {
      mkdirSync(dirname(location), { recursive: true })
    }
    this.db = new DatabaseSync(location)
    this.init()
  }

  private init() {
    this.db.exec(SCHEMA_SQL)
  }

  queryAll<T>(sql: string, params: (string | number | null)[] = []): T[] {
    const stmt = this.db.prepare(sql)
    return stmt.all(...params) as unknown as T[]
  }

  queryOne<T>(sql: string, params: (string | number | null)[] = []): T | undefined {
    const stmt = this.db.prepare(sql)
    const result = stmt.get(...params)
    return result ? (result as unknown as T) : undefined
  }

  execute(sql: string, params: (string | number | null)[] = []): { changes: number; lastInsertRowid: number | bigint } {
    const stmt = this.db.prepare(sql)
    const result = stmt.run(...params)
    return {
      changes: Number(result.changes),
      lastInsertRowid: result.lastInsertRowid,
    }
  }

  exec(sql: string): void {
    this.db.exec(sql)
  }

  close(): void {
    this.db.close()
  }
}

let defaultDbInstance: Database | null = null

export function getDatabase(location?: string): Database {
  if (!defaultDbInstance) {
    const dbPath = location ?? process.env.DATABASE_PATH ?? './data/pulseops.db'
    defaultDbInstance = new Database(dbPath)
  }
  return defaultDbInstance
}

export function createTestDatabase(): Database {
  return new Database(':memory:')
}
