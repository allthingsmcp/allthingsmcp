export function isProductionDeployment(
  environment: { NODE_ENV?: string; VERCEL_ENV?: string } = process.env,
) {
  return (
    environment.VERCEL_ENV === 'production' ||
    (!environment.VERCEL_ENV && environment.NODE_ENV === 'production')
  );
}
