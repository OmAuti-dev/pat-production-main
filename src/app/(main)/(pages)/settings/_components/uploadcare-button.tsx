'use client'
import React, { useEffect, useRef, useState } from 'react'
import * as LR from '@uploadcare/blocks'
import { useRouter } from 'next/navigation'
import Script from 'next/script'

interface UploadcareInfo {
  cdnUrl: string
  name: string
  size: number
  uuid: string
  isImage: boolean
  isStored: boolean
  originalUrl: string
}

declare const uploadcare: {
  Widget: (selector: string, options: {
    publicKey: string
    tabs: string
    previewStep: boolean
    crop: string
  }) => {
    onUploadComplete: (callback: (info: UploadcareInfo) => void) => void
    destroy: () => void
  }
}

type Props = {
  onUpload: (url: string) => void
}

LR.registerBlocks(LR)

const UploadCareButton = ({ onUpload }: Props) => {
  const router = useRouter()
  const ctxProviderRef = useRef<
    typeof LR.UploadCtxProvider.prototype & LR.UploadCtxProvider
  >(null)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const widgetRef = useRef<ReturnType<typeof uploadcare.Widget> | null>(null)

  useEffect(() => {
    if (!isScriptLoaded) return

    try {
      widgetRef.current = uploadcare.Widget('#uploader', {
      publicKey: process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY || '',
      tabs: 'file camera url',
      previewStep: true,
      crop: 'free',
    })

      widgetRef.current.onUploadComplete((info) => {
      onUpload(info.cdnUrl)
      router.refresh()
    })
    } catch (error) {
      console.error('Error initializing Uploadcare widget:', error)
    }

    return () => {
      try {
        if (widgetRef.current) {
          widgetRef.current.destroy()
          widgetRef.current = null
        }
      } catch (error) {
        console.error('Error destroying Uploadcare widget:', error)
      }
    }
  }, [onUpload, router, isScriptLoaded])

  return (
    <div>
      <Script
        src="https://ucarecdn.com/libs/widget/3.x/uploadcare.full.min.js"
        onLoad={() => setIsScriptLoaded(true)}
      />
      <input type="hidden" id="uploader" />
      <lr-config
        ctx-name="my-uploader"
        pubkey="a9428ff5ff90ae7a64eb"
      />

      <lr-file-uploader-regular
        ctx-name="my-uploader"
        css-src={`https://cdn.jsdelivr.net/npm/@uploadcare/blocks@0.35.2/web/lr-file-uploader-regular.min.css`}
      />

      <lr-upload-ctx-provider
        ctx-name="my-uploader"
        ref={ctxProviderRef}
      />
    </div>
  )
}

export default UploadCareButton
