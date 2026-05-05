import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { auth } from '@clerk/nextjs/server'

const f = createUploadthing()

export const ourFileRouter = {
  // Upload de logo del local — subimos a 8MB porque los PNG con fondo
  // transparente y los SVG de logos suelen pesar mas de 2MB.
  businessLogo: f({ image: { maxFileSize: '8MB', maxFileCount: 1 } })
    .middleware(async () => {
      const { userId } = await auth()
      if (!userId) throw new Error('Unauthorized')
      return { userId }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('[uploadthing] businessLogo OK userId=' + metadata.userId + ' url=' + file.ufsUrl)
      // ufsUrl es la URL canonica desde v7+. La incluimos explicitamente.
      return { url: file.ufsUrl, userId: metadata.userId }
    }),

  // Upload de foto de plato
  itemImage: f({ image: { maxFileSize: '8MB', maxFileCount: 1 } })
    .middleware(async () => {
      const { userId } = await auth()
      if (!userId) throw new Error('Unauthorized')
      return { userId }
    })
    .onUploadComplete(async ({ file }) => {
      console.log('[uploadthing] itemImage OK url=' + file.ufsUrl)
      return { url: file.ufsUrl }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
