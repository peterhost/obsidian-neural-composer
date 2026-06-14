import { SettingMigration } from '../setting.types'

import { migrateFrom12To13 } from './12_to_13'
import { migrateFrom13To14 } from './13_to_14'

export const SETTINGS_SCHEMA_VERSION = 14

export const SETTING_MIGRATIONS: SettingMigration[] = [
  {
    fromVersion: 12,
    toVersion: 13,
    migrate: migrateFrom12To13,
  },
  {
    fromVersion: 13,
    toVersion: 14,
    migrate: migrateFrom13To14,
  },
]
