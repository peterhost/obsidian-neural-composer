import { SettingMigration } from '../setting.types'

/**
 * Migration from version 13 to version 14
 * - Add lightRagAutoSync: automatically removes deleted/renamed files from the LightRAG index
 */
export const migrateFrom13To14: SettingMigration['migrate'] = (data) => {
  const newData = { ...data }
  newData.version = 14

  if (newData.lightRagAutoSync === undefined) {
    newData.lightRagAutoSync = false
  }

  return newData
}
