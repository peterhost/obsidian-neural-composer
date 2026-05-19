import { SettingMigration } from '../setting.types'

/**
 * Migration from version 13 to version 14
 * - Add lightRagSyncFolder: vault-relative folder to watch for incremental graph sync.
 *   Empty string means sync is disabled.
 */
export const migrateFrom13To14: SettingMigration['migrate'] = (data) => {
  const newData = { ...data }
  newData.version = 14

  // Replace any leftover lightRagAutoSync boolean with the new folder-based setting
  delete newData.lightRagAutoSync

  if (newData.lightRagSyncFolder === undefined) {
    newData.lightRagSyncFolder = ''
  }

  return newData
}
