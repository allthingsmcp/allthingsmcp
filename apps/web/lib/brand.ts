import identity from '../../../skills/all-things-mcp/brand-system/assets/identity.json';

export const brandIdentity = identity;

// Versioned URLs prevent old favicon/social previews from being reused by caches.
export const brandAssets = {
  logo: `/${identity.logo.compactOnLight}`,
  logoInverse: `/${identity.logo.compactOnDark}`,
  favicon: `/${identity.icon.favicon}`,
  favicon32: '/brand/open-junction/icons/favicon-32.png',
  appleTouch: '/brand/open-junction/icons/avatar-180.png',
  avatar: '/brand/open-junction/icons/avatar-512.png',
  socialCard: '/brand/open-junction/social-card-v2.png',
} as const;
