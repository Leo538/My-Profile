export interface Credential {
  id: string;
  name: string;
  issuer: string;
  date?: string;
  imageUrl?: string;
  imageAlt: string;
  credentialUrl?: string;
  certificateUrl?: string;
  status: 'verified' | 'pending';
  artworkKind: 'badge' | 'issuer-logo' | 'certificate';
  sourceUrl: string;
}

const FREECODECAMP_PROFILE =
  'https://www.freecodecamp.org/certification/fcc68208440-3597-4c8e-9f6e-266990cdd0e1';

export const CREDENTIALS: readonly Credential[] = [
  {
    id: 'cisco-introduction-iot',
    name: 'Introduction to IoT',
    issuer: 'Cisco',
    date: '2024-06-11',
    imageUrl: '/assets/credentials/cisco-introduction-iot.png',
    imageAlt: 'Insignia oficial de Cisco Introduction to IoT',
    credentialUrl: 'https://www.credly.com/badges/bca36865-b947-4b2e-b649-e52994d4a488',
    status: 'verified',
    artworkKind: 'badge',
    sourceUrl:
      'https://www.credly.com/api/v1/obi/v2/badge_assertions/bca36865-b947-4b2e-b649-e52994d4a488',
  },
  {
    id: 'cisco-network-support-security',
    name: 'Network Support and Security',
    issuer: 'Cisco',
    date: '2024-12-21',
    imageUrl: '/assets/credentials/cisco-network-support-security.png',
    imageAlt: 'Insignia oficial de Cisco Network Support and Security',
    credentialUrl:
      'https://www.credly.com/badges/65ea84a4-5e54-4615-98c1-019b50fdb1d9/linked_in_profile',
    status: 'verified',
    artworkKind: 'badge',
    sourceUrl:
      'https://www.credly.com/api/v1/obi/v2/badge_assertions/65ea84a4-5e54-4615-98c1-019b50fdb1d9',
  },
  {
    id: 'fcc-backend-apis',
    name: 'Back-End Development and APIs',
    issuer: 'freeCodeCamp',
    date: '2026-11-12',
    imageUrl: '/assets/credentials/fcc-backend.png',
    imageAlt: 'Certificado oficial de Back-End Development and APIs a nombre de Leonel Barros',
    credentialUrl: `${FREECODECAMP_PROFILE}/back-end-development-and-apis-v9`,
    status: 'verified',
    artworkKind: 'certificate',
    sourceUrl: `${FREECODECAMP_PROFILE}/back-end-development-and-apis-v9`,
  },
  {
    id: 'fcc-relational-databases',
    name: 'Relational Database',
    issuer: 'freeCodeCamp',
    date: '2026-09-11',
    imageUrl: '/assets/credentials/fcc-database.png',
    imageAlt: 'Certificado oficial de Relational Database a nombre de Leonel Barros',
    credentialUrl: `${FREECODECAMP_PROFILE}/relational-databases-v9`,
    status: 'verified',
    artworkKind: 'certificate',
    sourceUrl: `${FREECODECAMP_PROFILE}/relational-databases-v9`,
  },
  {
    id: 'fcc-foundational-csharp',
    name: 'Foundational C# with Microsoft',
    issuer: 'freeCodeCamp · Microsoft',
    date: '2026-08-21',
    imageUrl: '/assets/credentials/fcc-csharp.png',
    imageAlt: 'Certificado oficial de Foundational C# with Microsoft a nombre de Leonel Barros',
    credentialUrl: `${FREECODECAMP_PROFILE}/foundational-c-sharp-with-microsoft`,
    status: 'verified',
    artworkKind: 'certificate',
    sourceUrl: `${FREECODECAMP_PROFILE}/foundational-c-sharp-with-microsoft`,
  },
];
