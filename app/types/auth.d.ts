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
