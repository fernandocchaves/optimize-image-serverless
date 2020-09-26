import * as AWS from 'aws-sdk'
import sharp from 'sharp'
import { basename, extname } from 'path'

const S3 = new AWS.S3()
const Bucket = process.env.bucket

export const handle = async ({ Records: records }, context) => {
  try {
    console.log(records)

    await Promise.all(
      records.map(async record => {
        const { key } = record.s3.object
        const srcKey = decodeURIComponent(key.replace(/\+/g, " "))

        const image = await S3.getObject({
          Bucket,
          Key: srcKey
        }).promise()

        const optimized = await sharp(image.Body)
          .resize(1280, 720, { fit: 'inside', withoutEnlargement: true })
          .toFormat('jpeg', { progressive: true, quality: 50 })
          .toBuffer()

        await S3.putObject({
          Body: optimized,
          Bucket,
          ContentType: 'image/jpeg',
          Key: `compressed/${basename(key, extname(key))}.jpg`
        }).promise()
      })
    )

    return {
      statusCode: 301,
      body: {}
    }
  } catch (error) {
    console.log(error)
    return error
  }
}
