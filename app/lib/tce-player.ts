import axios from "axios";
import { env } from "./env";

const getErrorMessage = (error: any) => {
  if (axios.isAxiosError(error)) {
    console.error("Axios error:", error.response?.data || error.message);
  } else if (error instanceof Error) {
    console.error("Error:", error.message);
  } else {
    console.error("Unexpected error:", error);
  }
};

function setCookiesInBrowser(cookies: Record<string, CookieConfig>) {
  for (const [key, config] of Object.entries(cookies)) {
    let cookieStr = `${key}=${config.value}; path=/; max-age=${config.max_age}; samesite=${config.samesite}`;

    if (config.secure) {
      cookieStr += "; secure";
    }

    document.cookie = cookieStr;
  }
}

export async function fetchClientId(): Promise<ClientId | undefined> {
  try {
    const response = await axios.get<ApiResponse<ClientIdData>>(
      `${env.api_url}/v1/api/user/tceplayer/clientid`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionStorage.getItem("token")}`,
        },
        withCredentials: true,
      },
    );
    console.log("clientId response :", response.data.data);
    setCookiesInBrowser(response.data.data.cookies);
    console.log("Cookies after setting:", document.cookie);

    return response.data.data.clientId;
  } catch (error) {
    getErrorMessage(error);
  }
}

export async function fetchToken(): Promise<TokenData | undefined> {
  try {
    const params = new URLSearchParams();
    params.append("school_name", "Azvasa Demo School");
    params.append("role", "Teacher");
    params.append("grant_type", "password");
    params.append("user_name", "sunil");

    const response = await axios.post<ApiResponse<TokenData>>(
      `${env.api_url}/v1/api/user/tceplayer/token`,
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        withCredentials: true, // sends cookies along
      },
    );

    console.log("token:", response.data.data);
    return response.data.data;
  } catch (error) {
    getErrorMessage(error);
  }
}

export function getExpiryTime(
  token: TokenData | undefined,
  client: ClientId | undefined,
) {
  if (typeof token === "undefined" || typeof client === "undefined") {
    throw "TCE didn't authorize this client";
  }

  const expiryTime = token.tstamp || 0 + parseInt(client.clientTimeout || "0");

  // Log the raw numeric expiryTime for debugging.
  console.log("Calculated expiryTime (raw number):", expiryTime);

  // Assuming expiryTime is a Unix timestamp in seconds.
  // Convert it to milliseconds for the Date constructor.
  const expiryDate = new Date(expiryTime * 1000);

  // Log the expiry time in a human-readable format.
  // toLocaleString() provides a locale-specific date and time format.
  console.log("Expiry time (human readable):", expiryDate.toLocaleString("en"));

  return expiryTime;
}

export async function fetchTCEAssetDetails(ids: string[], accessToken: string) {
  try {
    const params = new URLSearchParams();
    params.append("ids", ids.join(","));
    params.append("accessToken", accessToken);

    const response = await axios.post(
      `${env.api_url}/v1/api/user/tceplayer/assets`,
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        withCredentials: true,
      },
    );

    const assetData = response.data.data;
    const raw = assetData.playlistJson;
    const playlist = JSON.parse(raw);

    return playlist.asset[0] as TCEAsset;
  } catch (error) {
    console.error("Error fetching TCE asset details:", error);
    getErrorMessage(error);
    return undefined;
  }
}

export async function fetchMultipleTCEAssetDetails(
  ids: string[],
  accessToken: string,
): Promise<TCEAsset[]> {
  try {
    const params = new URLSearchParams();
    params.append("ids", ids.join(","));
    params.append("accessToken", accessToken);

    const response = await axios.post(
      `${env.api_url}/v1/api/user/tceplayer/assets`,
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        withCredentials: true,
      },
    );

    const assetData = response.data.data;
    const raw = assetData.playlistJson;
    const playlist = JSON.parse(raw);

    return playlist.asset as TCEAsset[];
  } catch (error) {
    console.error("Error fetching TCE asset details:", error);
    getErrorMessage(error);
    return [];
  }
}
