export const STORAGE_USERINFO_KEY = 'userInfo'

export const useUserInfo = createGlobalState(() => useStorage<null | string>(STORAGE_USERINFO_KEY, null))
