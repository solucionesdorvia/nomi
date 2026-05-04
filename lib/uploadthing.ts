import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { auth } from '@clerk/nextjs/server'

const f = createUploadthing()

export const ourFileRouter = {
  // Upload de logo del local
  businessLogo: f({ image: { maxFileSize: '2MB', maxFileCount: 1 } })
    .middleware(async () => {
      const { userId } = await auth()
      if (!userId) throw new Error('Unauthorized')
      return { userId }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { url: file.url, userId: metadata.userId }
    }),

  // Upload de foto de plato
  itemImage: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(async () => {
      const { userId } = await auth()
      if (!userId) throw new Error('Unauthorized')
      return { userId }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
