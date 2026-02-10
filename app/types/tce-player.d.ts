interface CookieConfig {
  max_age: number;
  samesite: string;
  domain: string;
  httponly: boolean;
  secure: boolean;
  value: string;
}

interface ClientId {
  apiVersion: string;
  sessionTimeout: string;
  clientTimeout: string;
  defaultSchool: string;
  tstamp: number;
}

interface ClientIdData {
  cookies: Record<string, CookieConfig>;
  clientId: ClientId;
}

interface TokenData {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  mode: string;
  tstamp: number;
}

interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  errorCode: string | null;
  path: string | null;
}

interface AngularZone {
  run: (fn: () => void) => void;
}

interface AngularPlayerReference {
  zone: AngularZone;
  resizeFn?: () => void;
  tceplayerTokenFn: (config: { detail: Record<string, unknown> }) => void;
  tceplayerConfigFn: (config: { detail: Record<string, unknown> }) => void;
  tcePlayerLoadedFn: () => {
    subscribe: (observer: {
      next: () => void;
      error: (error: unknown) => void;
    }) => { unsubscribe: () => void };
  };
  tceplayerInitFn: () => void;
  subscription?: { unsubscribe: () => void };
}

interface TCEAsset {
  assetId: string;
  tpId: string;
  lcmsSubjectId: string;
  lcmsGradeId: string;
  title: string;
  mimeType: string;
  assetType: string;
  thumbFileName: string;
  fileName: string;
  ansKeyId: string | null;
  copyright: string;
  subType: string;
  description: string;
  keywords: string;
  encryptedFilePath: string;
}

interface TCEPlayerProps {
  accessToken: string;
  expiryTime: number;
  expiresIn: number;
  asset: TCEAsset;
}

interface Window {
  angularReference?: Record<string, AngularPlayerReference>;
}
