import fs from 'fs/promises';
import puppeteer from 'puppeteer';
import sharp from 'sharp';

const logger = console;

const list = [
  '00:00.svg', '01:00.svg', '02:00.svg', '03:00.svg', '04:00.svg', '05:00.svg',
  '06:00.svg', '07:00.svg', '08:00.svg', '09:00.svg', '10:00.svg', '11:00.svg',
  '12:00.svg', '13:00.svg', '14:00.svg', '15:00.svg', '16:00.svg', '17:00.svg',
  '18:00.svg', '19:00.svg', '20:00.svg', '21:00.svg', '22:00.svg', '23:00.svg',
];

const start = async () => {
  logger.info('Start');
  const browser = await puppeteer.launch();

  for (const fname of list) {
    logger.info(fname);
    const svg = await fs.readFile(`svg/${fname}`, 'utf8');
    const page = await browser.newPage();
    await page.setContent(svg);
    const elementHandle = await page.$('svg');

    const tempPng = `png/${fname.replace('.svg', '_temp.png')}`;
    const finalPng = `png/${fname.replace('.svg', '.png')}`;

    await elementHandle.screenshot({ path: tempPng });
    await page.close();

    const pngBuffer = await fs.readFile(tempPng);
    await sharp(pngBuffer)
    .resize(128, 128)
    .toFile(finalPng);

    await fs.unlink(tempPng);
    logger.info(`変換完了: ${finalPng}`);
  }

  await browser.close();
  logger.info('Finish');
};

start();
