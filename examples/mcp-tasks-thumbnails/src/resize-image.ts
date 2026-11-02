import sharp from 'sharp';

// A new pipeline for every output: calling resize repeatedly on one pipeline
// would only apply the last resize.
export async function resizeImage(
  input: string,
  output: string,
  width: number,
) {
  return sharp(input)
    .autoOrient()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(output);
}
