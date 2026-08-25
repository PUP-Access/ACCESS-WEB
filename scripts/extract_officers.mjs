import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const userUploadedDir = 'C:/Users/Zach/.gemini/antigravity-ide/brain/c3b894c9-d794-418c-986f-27b34de34153/.user_uploaded';
const outputDir = 'c:/ACCESS-WEB/public/officers';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const imgPath = path.join(userUploadedDir, 'media_1787676201137.png');

const officersCoords = [
  // Tier 1
  { id: 'tantia-antonio-mickel', cx: 315, cy: 42, r: 28 },
  // Tier 2
  { id: 'camanso-jewel', cx: 315, cy: 156, r: 28 },
  // Tier 3
  { id: 'gacu-laiza-may', cx: 98, cy: 271, r: 28 },
  { id: 'valencia-zuriel-elijah', cx: 243, cy: 271, r: 28 },
  { id: 'gines-julianna', cx: 388, cy: 271, r: 28 },
  { id: 'zapanta-ren', cx: 533, cy: 271, r: 28 },
  // Tier 4
  { id: 'maristela-john-rowie', cx: 163, cy: 398, r: 28 },
  { id: 'layag-jaiquose', cx: 315, cy: 398, r: 28 },
  { id: 'mula-ivan', cx: 468, cy: 398, r: 28 },
  // Tier 5
  { id: 'guillermo-erica', cx: 98, cy: 513, r: 28 },
  { id: 'villanueva-avecydee-chris', cx: 243, cy: 513, r: 28 },
  { id: 'dionisio-dashiell-john', cx: 388, cy: 513, r: 28 },
  { id: 'encanto-tres-inigo', cx: 533, cy: 513, r: 28 },
  // Tier 6
  { id: 'alba-blessie-jane', cx: 315, cy: 635, r: 28 },
  // Tier 7
  { id: 'lim-sophia-queen', cx: 163, cy: 757, r: 28 },
  { id: 'ampon-arsher-roey', cx: 315, cy: 757, r: 28 },
  { id: 'regualos-gren-nathan', cx: 468, cy: 757, r: 28 },
  // Tier 8
  { id: 'castillejos-mary-lou', cx: 243, cy: 875, r: 28 },
  { id: 'kinkito-mark-andrei', cx: 388, cy: 875, r: 28 },
];

async function extract() {
  const metadata = await sharp(imgPath).metadata();
  console.log('Source metadata:', metadata.width, 'x', metadata.height);

  for (const off of officersCoords) {
    const left = Math.max(0, Math.round(off.cx - off.r));
    const top = Math.max(0, Math.round(off.cy - off.r));
    const size = Math.round(off.r * 2);

    await sharp(imgPath)
      .extract({ left, top, width: size, height: size })
      .resize(200, 200, { fit: 'cover', kernel: sharp.kernel.lanczos3 })
      .webp({ quality: 95 })
      .toFile(path.join(outputDir, `${off.id}.webp`));
    console.log(`Extracted: ${off.id}.webp`);
  }
}

extract().catch(console.error);
