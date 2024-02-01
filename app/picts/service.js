const sharp = require('sharp');
const {
  S3Client, PutObjectCommand, GetObjectCommand,
  ListObjectsV2Command, DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { logger } = require('@jobscale/logger');
const { service: configService } = require('../config/service');

const { ENV } = process.env;
const Bucket = `${ENV || 'dev'}-storage-737635344638`;
const region = 'us-east-1';

class Service {
  async find({ login }) {
    const config = await this.config();
    const s3 = new S3Client(config);
    const Prefix = `${login}/thumbnail/`;
    const { Contents } = await s3.send(new ListObjectsV2Command({
      Bucket, Prefix,
    }));
    const images = Contents?.map(obj => obj.Key.replace(Prefix, '')) || [];
    return { images };
  }

  async image({ login, type, fname }) {
    const dir = type === 'i' ? 'picts' : 'thumbnail';
    const config = await this.config();
    const s3 = new S3Client(config);
    const Key = `${login}/${dir}/${fname}`;
    const { ContentType, Body } = await s3.send(new GetObjectCommand({
      Bucket, Key,
    }));
    return { ContentType, buffer: Body };
  }

  async upload({ login, files }) {
    if (!login) throw new Error('login must be string');
    const config = await this.config();
    const s3 = new S3Client(config);
    // eslint-disable-next-line no-restricted-syntax
    for (const file of files) {
      const { originalname: fname, size, buffer, mimetype: ContentType } = file;
      logger.info({ login, fname, size });
      const imageInfo = await sharp(buffer).metadata();
      const thumbnailBuffer = await sharp(buffer)
      .resize({ width: 128, height: 128 })
      .toFormat(imageInfo.format, { progressive: true, force: false })
      .toBuffer()
      .catch(e => {
        logger.info(e);
        throw e;
      });
      const Key = `${login}/picts/${fname}`;
      const thumbnailKey = `${login}/thumbnail/${fname}`;
      await Promise.all([
        s3.send(new PutObjectCommand({
          Bucket, Key: thumbnailKey, Body: thumbnailBuffer, ContentType,
        })),
        s3.send(new PutObjectCommand({
          Bucket, Key, Body: buffer, ContentType,
        })),
      ]);
    }
  }

  async remove({ login, fname }) {
    if (!login) throw new Error('login must be string');
    const config = await this.config();
    const s3 = new S3Client(config);
    const Key = `${login}/picts/${fname}`;
    const thumbnailKey = `${login}/thumbnail/${fname}`;
    await Promise.all([
      s3.send(new DeleteObjectCommand({
        Bucket, Key: thumbnailKey,
      })),
      s3.send(new DeleteObjectCommand({
        Bucket, Key,
      })),
    ]);
  }

  async config() {
    const env = await configService.getEnv('storage');
    return {
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      ...env,
      region,
    };
  }
}

module.exports = {
  Service,
  service: new Service(),
};
