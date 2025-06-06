import { create } from 'zustand'

export interface Option {
  value: string
  label: string
  disable?: boolean
  /** fixed option that can't be removed. */
  fixed?: boolean
  /** Group the options by providing key. */
  [key: string]: string | boolean | undefined
}

type PATStore = {
  googleFile: any
  setGoogleFile: (file: any) => void
  slackChannels: string[]
  setSlackChannels: (channels: string[]) => void
  selectedSlackChannels: string[]
  setSelectedSlackChannels: (channels: string[]) => void
}

export const usePATStore = create<PATStore>()((set) => ({
  googleFile: null,
  setGoogleFile: (file) => set({ googleFile: file }),
  slackChannels: [],
  setSlackChannels: (channels) => set({ slackChannels: channels }),
  selectedSlackChannels: [],
  setSelectedSlackChannels: (channels) => set({ selectedSlackChannels: channels }),
}))


