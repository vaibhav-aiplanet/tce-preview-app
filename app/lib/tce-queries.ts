import { useQuery } from "@tanstack/react-query";
import {
  fetchClientId,
  fetchToken,
  fetchTCEAssetDetails,
  fetchMultipleTCEAssetDetails,
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
      if (!asset) throw new Error("Failed to fetch asset details");

      return { ...auth, asset };
    },
    enabled: !!assetId,
    retry: 2,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useBatchAssetData(assetIds: string[]) {
  const query = useQuery({
    queryKey: ["tce-batch-assets", assetIds],
    queryFn: async () => {
      const auth = await fetchAuth();
      const assets = await fetchMultipleTCEAssetDetails(
        assetIds,
        auth.accessToken,
      );
      return { ...auth, assets };
    },
    enabled: assetIds.length > 0,
    retry: 2,
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
