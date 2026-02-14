interface OAuthUserInfo {
  id: string;
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  role: string;
  schoolId?: string;
  branchId?: string;
}

interface OAuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userInfo: OAuthUserInfo;
}

interface TokenRefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

interface TokenValidateResponse {
  valid: boolean;
  user_id: string;
  client_id: string;
  expires_at: string;
  userInfo: {
    id: string;
    first_name: string;
    last_name: string;
    user_name: string;
    email: string;
    role: string;
    is_active: boolean;
    is_deleted: boolean;
    school_id: string | null;
    branch_id: string | null;
  };
}
