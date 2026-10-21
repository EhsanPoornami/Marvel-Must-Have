import { useState } from 'react'
import type { Volume } from '../types'

/** Cover image with a typographic placeholder when the URL is missing or broken. */
export function Cover({ volume, className = '' }: { volume: Volume; className?: string }) {
  const [failed, setFailed] = useState(false)
  const showImage = volume.copertinaUrl && !failed

  return (
    <div className={`relative aspect-[17/26] overflow-hidden bg-gradient-to-br from-neutral-800 to-neutral-900 ${className}`}>
      {showImage ? (
        <img
          src={volume.copertinaUrl}
          alt={`Copertina di ${volume.titolo}`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-1 p-2 text-center">
          <span className="font-display text-2xl text-marvel">{volume.numero ?? '?'}</span>
          <span className="line-clamp-3 text-[11px] leading-tight text-neutral-400">{volume.titolo}</span>
        </div>
      )}
    </div>
  )
}
