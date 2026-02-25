import { useCallback, useEffect, useState, useRef } from "react";

const TCEPlayer = ({
  accessToken,
  expiryTime,
  expiresIn,
  asset,
}: TCEPlayerProps) => {
  console.log(asset);
  const [isResourcesLoaded, setIsResourcesLoaded] = useState(false);
  const [, setIsPlayerInitialized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const playerContainerRef = useRef<HTMLDivElement>(null);
  const playerWrapperRef = useRef<HTMLDivElement>(null);
  const tcePlayerIdRef = useRef<string | null>(null);
  const angularReferenceRef = useRef<AngularPlayerReference | null>(null);
  const isPlayerInitializedRef = useRef(false);
  const assetRef = useRef(asset);

  useEffect(() => {
    assetRef.current = asset;
  }, [asset]);

  const loadScript = useCallback((src: string) => {
    return new Promise<void>((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.head.appendChild(script);
    });
  }, []);

  function onResize() {
    if (!tcePlayerIdRef.current) return;

    const playerRef = window.angularReference?.[tcePlayerIdRef.current];

    playerRef?.zone.run(() => {
      if (playerRef?.resizeFn) {
        playerRef.resizeFn();
      }
    });
  }

  const handleFullscreen = useCallback(() => {
    const wrapper = playerWrapperRef.current;
    if (!wrapper) return;

    if (!document.fullscreenElement) {
      wrapper
        .requestFullscreen()
        .then(() => {
          setTimeout(onResize, 100);
        })
        .catch((err) => {
          console.error("Error attempting to enable fullscreen:", err);
        });
    } else {
      document.exitFullscreen().then(() => {
        setTimeout(onResize, 100);
      });
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(onResize, 100);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const loadStyle = useCallback((href: string) => {
    return new Promise<void>((resolve, reject) => {
      const existingLink = document.querySelector(`link[href="${href}"]`);
      if (existingLink) {
        resolve();
        return;
      }

      const link = document.createElement("link");
      link.href = href;
      link.rel = "stylesheet";
      link.onload = () => resolve();
      link.onerror = () => reject();
      document.head.appendChild(link);
    });
  }, []);

  useEffect(() => {
    const loadResources = async () => {
      try {
        setLoadError(false);

        await loadStyle(`/tceplayer-two/styles.css`);
        await loadScript(
          `/tceplayer-two/assets/tcemedia/external/player-html/player/js/shell/common/resizePlayer.js`,
        );
        await loadScript(`/tceplayer-two/tce-player-hybrid.js`);

        setIsResourcesLoaded(true);
      } catch (error) {
        console.error("Failed to load TCE Player resources:", error);
        setLoadError(true);
      }
    };

    loadResources();
  }, [loadScript, loadStyle, retryCount]);

  const handleLoadPlayer = useCallback(
    (event: CustomEvent<string>) => {
      console.log("loadplayer event received!", event);

      const playerId = event.detail;
      console.log("Player ID:", playerId);

      if (
        tcePlayerIdRef.current === playerId &&
        isPlayerInitializedRef.current
      ) {
        console.log("Player already initialized, skipping...");
        return;
      }

      tcePlayerIdRef.current = playerId;

      const configData = {
        detail: {
          tcePlayerId: playerId,
          resourceData: assetRef.current,
          iFrameCss: {
            position: "absolute",
            top: "0px",
            left: "0px",
            width: "993px",
            height: "610px",
            overflowX: "hidden",
            overflowY: "hidden",
          },
          baseUrl: "",
          gateway: "",
          minEraserArea: 50,
        },
      };

      const angularReference = window.angularReference?.[playerId];
      if (!angularReference) return;

      angularReferenceRef.current = angularReference;

      const zone = angularReference.zone;

      // Configure player
      zone.run(() => {
        angularReference.tceplayerTokenFn({
          detail: {
            access_token: accessToken,
            access_token_expiry_time: expiryTime,
            access_token_gen_time: expiresIn,
          },
        });

        angularReference.tceplayerConfigFn({
          detail: {
            ...configData.detail,
            minEraserArea: 10000000000,
          },
        });
      });

      // Initialize player
      zone.run(() => {
        const subscription = angularReference.tcePlayerLoadedFn().subscribe({
          next: () => {
            console.log("TCE Player loaded and ready!");
            isPlayerInitializedRef.current = true;
            setIsPlayerInitialized(true);
          },
          error: (error) => {
            console.error("TCE Player loading error:", error);
          },
        });

        // Store subscription for cleanup
        // @ts-ignore - null check done above
        angularReferenceRef.current.subscription = subscription;

        console.log("Calling angularReference.tceplayerInitFn()");
        angularReference.tceplayerInitFn();
      });
    },
    [accessToken, asset, expiresIn, expiryTime],
  );

  useEffect(() => {
    if (!isResourcesLoaded || !playerContainerRef.current) return;

    const container = playerContainerRef.current;

    // Clear existing content
    container.innerHTML = "";

    console.log("Creating TCE Player element...");

    // Create tce-player element
    const tcePlayerElement = document.createElement("tce-player");

    console.log("TCE Player element created:", tcePlayerElement);

    // Add event listener
    tcePlayerElement.addEventListener(
      "loadplayer",
      handleLoadPlayer as EventListener,
    );

    // Append to container
    container.appendChild(tcePlayerElement);

    console.log("TCE Player element appended to container");

    return () => {
      console.log("Cleaning up TCE Player...");

      tcePlayerElement.removeEventListener(
        "loadplayer",
        handleLoadPlayer as EventListener,
      );

      // Clear container
      if (container) {
        container.innerHTML = "";
      }

      if (angularReferenceRef.current?.subscription) {
        angularReferenceRef.current.subscription.unsubscribe();
      }
    };
  }, [isResourcesLoaded, handleLoadPlayer]);

  if (loadError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-sm text-danger">Failed to load player resources.</p>
        <button
          onClick={() => setRetryCount((c) => c + 1)}
          className="cursor-pointer rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Reload Player
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        backgroundColor: "transparent",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <button
        onClick={handleFullscreen}
        className="absolute top-2 right-2 z-10 cursor-pointer rounded-md bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur-sm transition-colors hover:bg-black/80"
      >
        {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
      </button>
      <div
        ref={playerWrapperRef}
        id="parentId"
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: isFullscreen ? "#000" : "transparent",
        }}
      >
        <div ref={playerContainerRef} className="absolute inset-0 mx-auto" />
      </div>
    </div>
  );
};

export default TCEPlayer;
