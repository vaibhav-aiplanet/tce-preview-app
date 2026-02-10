import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchClientId,
  fetchToken,
  fetchTCEAssetDetails,
  getExpiryTime,
} from "~/lib/tce-player";

async function fetchAuth() {
  const client = await fetchClientId();
  if (!client) throw new Error("Failed to fetch client ID");

  const token = await fetchToken();
  if (!token) throw new Error("Failed to fetch token");

  const expiryTime = getExpiryTime(token, client);

  return {
    accessToken: token.access_token,
    expiryTime,
    expiresIn: token.expires_in,
  };
}

export function useTCEPlayerData(assetId: string) {
  const query = useQuery({
    queryKey: ["tce-player-data", assetId],
    queryFn: async () => {
      const auth = await fetchAuth();
      const asset = await fetchTCEAssetDetails([assetId], auth.accessToken);

      return { ...auth, asset };
    },
    enabled: !!assetId,
    retry: 2,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useTokenRefresh(expiresIn: number) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["tce-token-refresh"],
    queryFn: fetchAuth,
    enabled: false,
    refetchInterval: expiresIn > 0 ? expiresIn * 1000 * 0.8 : false,
    refetchIntervalInBackground: true,
    initialData: () => {
      // Seed from the initial player data query to avoid a duplicate fetch on mount
      const cached = queryClient.getQueriesData<{
        accessToken: string;
        expiryTime: number;
        expiresIn: number;
      }>({ queryKey: ["tce-player-data"] });
      const entry = cached.find(([, data]) => data != null);
      if (entry?.[1]) {
        const { accessToken, expiryTime, expiresIn } = entry[1];
        return { accessToken, expiryTime, expiresIn };
      }
      return undefined;
    },
  });
}
