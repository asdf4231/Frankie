/**
 * Shrink image attachments on the student's device before upload.
 *
 * DeepSeek rescales every image to about 1300×1300 pixels before inference (1024 tokens per image at most),
 * so larger uploads only cost bandwidth. The server applies the same rule as a fallback (attachments.py), so
 * an image that cannot be decoded here is sent as is.
 */

const IMAGE_PIXEL_BUDGET = 1300 * 1300
const IMAGE_PASSTHROUGH_BYTES = 500 * 1024
const IMAGE_JPEG_QUALITY = 0.8

export const isImageFile = (file: File) => /\.(png|jpe?g)$/i.test(file.name)

const encodeJpeg = (canvas: HTMLCanvasElement) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', IMAGE_JPEG_QUALITY))

/** Resolve to a JPEG within the pixel budget, or to the original file when it is already small or cannot be shrunk. */
export async function shrinkImage(file: File): Promise<File> {
  if (!isImageFile(file) || file.size <= IMAGE_PASSTHROUGH_BYTES) return file
  try {
    // Decoding applies the EXIF orientation, so phone photos come out upright without the tag.
    const source = await createImageBitmap(file)
    try {
      const scale = Math.min(1, Math.sqrt(IMAGE_PIXEL_BUDGET / (source.width * source.height)))
      const width = Math.max(1, Math.round(source.width * scale))
      const height = Math.max(1, Math.round(source.height * scale))
      const resized = await createImageBitmap(source, { resizeWidth: width, resizeHeight: height, resizeQuality: 'high' })
      try {
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const context = canvas.getContext('2d')
        if (!context) return file
        // JPEG has no alpha channel: transparent areas become white, not black.
        context.fillStyle = '#fff'
        context.fillRect(0, 0, width, height)
        context.imageSmoothingQuality = 'high'
        context.drawImage(resized, 0, 0, width, height)
        const blob = await encodeJpeg(canvas)
        if (!blob || blob.size >= file.size) return file
        // The name stays, so the chip and the chat keep showing the file the student picked.
        return new File([blob], file.name, { type: 'image/jpeg', lastModified: file.lastModified })
      } finally {
        resized.close()
      }
    } finally {
      source.close()
    }
  } catch {
    return file
  }
}
