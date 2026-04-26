'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  name: string
  initialUrl?: string | null
  required?: boolean
}

export default function ImageDropzone({ name, initialUrl, required }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null)
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview)
    }
  }, [preview])

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file.type.startsWith('image/')) return
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview)
    setPreview(URL.createObjectURL(file))
    setFileName(file.name)
    // Sync to the hidden file input so FormData picks it up
    if (inputRef.current) {
      const dt = new DataTransfer()
      dt.items.add(file)
      inputRef.current.files = dt.files
    }
  }

  function clear(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview)
    setPreview(initialUrl ?? null)
    setFileName(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div
      className={`dropzone${isDragging ? ' dropzone-dragging' : ''}${preview ? ' dropzone-has-preview' : ''}`}
      onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={e => {
        e.preventDefault()
        setIsDragging(false)
        handleFiles(e.dataTransfer.files)
      }}
      onClick={() => inputRef.current?.click()}
    >
      {preview ? (
        <div className="dropzone-preview-wrap">
          <img src={preview} alt="Preview" className="dropzone-preview" />
          <button type="button" className="dropzone-clear" onClick={clear} title="Fjern bilde">
            ✕
          </button>
          <div className="dropzone-filename">{fileName ?? 'Eksisterende bilde'}</div>
        </div>
      ) : (
        <div className="dropzone-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
          <div className="dropzone-text">
            <strong>Slipp et bilde her</strong> eller <span className="dropzone-link">klikk for å velge</span>
          </div>
          <div className="dropzone-hint">PNG, JPG, WEBP — opptil 10 MB</div>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/*"
        required={required && !initialUrl}
        style={{ display: 'none' }}
        onChange={e => handleFiles(e.target.files)}
      />
    </div>
  )
}
