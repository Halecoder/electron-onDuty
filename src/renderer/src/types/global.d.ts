import { api } from '../services/api'

declare global {
  interface Window {
    api: typeof api
  }
}
