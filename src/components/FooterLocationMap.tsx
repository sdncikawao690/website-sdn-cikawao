/// <reference types="google.maps" />
import { useEffect, useState } from 'react';
import {
  AdvancedMarker,
  APIProvider,
  APILoadingStatus,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { ExternalLink, Loader2, MapPin, Navigation } from 'lucide-react';
import { SCHOOL_INFO } from '../types/school';

interface ResolvedPlace {
  name: string;
  formattedAddress: string;
  location: google.maps.LatLngLiteral;
  googleMapsURI: string | null;
  attributions: Array<{ provider: string; providerURI: string | null }>;
}

const MAPS_SEARCH_FALLBACK_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${SCHOOL_INFO.name}, ${SCHOOL_INFO.address}`
)}`;

function isQuotaError(err: unknown): boolean {
  if (!err) return false;
  const text =
    err instanceof Error
      ? `${err.name} ${err.message}`
      : typeof err === 'object'
        ? JSON.stringify(err)
        : String(err);
  return (
    text.includes('RESOURCE_EXHAUSTED') ||
    text.includes('OVER_QUERY_LIMIT') ||
    text.includes('QuotaExceededError') ||
    text.includes('OverQuotaMapError') ||
    /\b429\b/.test(text)
  );
}

function SchoolMapCanvas({
  onResolvedPlace,
  onResolveError,
}: {
  onResolvedPlace: (place: ResolvedPlace) => void;
  onResolveError: (message: string) => void;
}) {
  const apiStatus = useApiLoadingStatus();
  const placesLib = useMapsLibrary('places');
  const [resolvedPlace, setResolvedPlace] = useState<ResolvedPlace | null>(null);
  const [isSearching, setIsSearching] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoWindowOpen, setInfoWindowOpen] = useState(true);
  const [markerRef, marker] = useAdvancedMarkerRef();

  useEffect(() => {
    if (apiStatus === APILoadingStatus.AUTH_FAILURE) {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      const msg = 'Peta Google Maps tidak dapat dimuat karena batas kuota atau otorisasi API.';
      setErrorMessage(msg);
      setIsSearching(false);
      onResolveError(msg);
    } else if (apiStatus === APILoadingStatus.FAILED) {
      const msg = 'Gagal memuat layanan Google Maps. Silakan buka lokasi langsung di Google Maps.';
      setErrorMessage(msg);
      setIsSearching(false);
      onResolveError(msg);
    }
  }, [apiStatus, onResolveError]);

  useEffect(() => {
    if (!placesLib) return;

    let cancelled = false;

    async function lookupSchoolLocation() {
      setIsSearching(true);
      setErrorMessage(null);

      const queries = [
        `${SCHOOL_INFO.name}, ${SCHOOL_INFO.address}`,
        SCHOOL_INFO.address,
        `${SCHOOL_INFO.name}, ${SCHOOL_INFO.shortAddress}, Jawa Barat`,
        `${SCHOOL_INFO.shortAddress}, Jawa Barat`,
      ];

      try {
        for (const textQuery of queries) {
          const { places } = await placesLib!.Place.searchByText({
            textQuery,
            fields: ['displayName', 'formattedAddress', 'location', 'googleMapsURI'],
            language: 'id',
            region: 'ID',
            maxResultCount: 1,
            internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'],
          });

          const match = places?.[0];
          if (match?.location) {
            if (cancelled) return;
            const lat = match.location.lat();
            const lng = match.location.lng();
            const nextPlace: ResolvedPlace = {
              name: match.displayName || SCHOOL_INFO.name,
              formattedAddress: match.formattedAddress || SCHOOL_INFO.address,
              location: { lat, lng },
              googleMapsURI: match.googleMapsURI || null,
              attributions: (match.attributions || []).map((attr: google.maps.places.Attribution) => ({
                provider: attr.provider || '',
                providerURI: attr.providerURI || null,
              })),
            };
            setResolvedPlace(nextPlace);
            onResolvedPlace(nextPlace);
            setIsSearching(false);
            return;
          }
        }

        if (!cancelled) {
          const msg = 'Koordinat alamat belum ditemukan secara otomatis di peta.';
          setErrorMessage(msg);
          setIsSearching(false);
          onResolveError(msg);
        }
      } catch (err) {
        if (cancelled) return;
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        const msg = 'Peta interaktif sementara tidak tersedia. Gunakan tautan Google Maps di atas.';
        setErrorMessage(msg);
        setIsSearching(false);
        onResolveError(msg);
      }
    }

    void lookupSchoolLocation();

    return () => {
      cancelled = true;
    };
  }, [placesLib, onResolvedPlace, onResolveError]);

  if (errorMessage) {
    return (
      <div className="h-[240px] sm:h-[260px] w-full flex flex-col items-center justify-center gap-3 px-6 text-center bg-slate-900/70">
        <div className="w-11 h-11 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300">
          <MapPin className="w-5 h-5" />
        </div>
        <div className="space-y-1 max-w-md">
          <p className="text-xs font-bold text-white">{SCHOOL_INFO.name}</p>
          <p className="text-xs text-slate-300 leading-relaxed">{SCHOOL_INFO.address}</p>
          <p className="text-[11px] text-amber-300/90">{errorMessage}</p>
        </div>
        <a
          href={MAPS_SEARCH_FALLBACK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-colors"
        >
          <Navigation className="w-3.5 h-3.5" />
          Buka di Google Maps
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  if (isSearching || !resolvedPlace) {
    return (
      <div className="h-[240px] sm:h-[260px] w-full flex flex-col items-center justify-center gap-2.5 bg-slate-900/60 text-slate-300">
        <Loader2 className="w-5 h-5 animate-spin text-sky-300" />
        <p className="text-xs font-medium">Memuat peta lokasi {SCHOOL_INFO.name}...</p>
      </div>
    );
  }

  return (
    <div className="relative h-[240px] sm:h-[260px] w-full">
      <GoogleMap
        mapId="DEMO_MAP_ID"
        defaultCenter={resolvedPlace.location}
        defaultZoom={16}
        gestureHandling="cooperative"
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={true}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        className="w-full h-full"
      >
        <AdvancedMarker
          ref={markerRef}
          position={resolvedPlace.location}
          title={resolvedPlace.name}
          onClick={() => setInfoWindowOpen((prev) => !prev)}
        >
          <Pin
            background="#0284c7"
            borderColor="#e0f2fe"
            glyphColor="#ffffff"
            scale={1.15}
          />
        </AdvancedMarker>

        {infoWindowOpen && marker && (
          <InfoWindow
            anchor={marker}
            maxWidth={270}
            onCloseClick={() => setInfoWindowOpen(false)}
          >
            <div className="text-slate-900 space-y-1.5 p-0.5">
              <p className="text-xs font-extrabold text-sky-900 leading-snug">
                {SCHOOL_INFO.name}
              </p>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                {SCHOOL_INFO.address}
              </p>
              {resolvedPlace.attributions.length > 0 && (
                <p className="text-[10px] text-slate-500">
                  Sumber:{' '}
                  {resolvedPlace.attributions.map((attr, idx) => (
                    <span key={`${attr.provider}-${idx}`}>
                      {idx > 0 ? ', ' : ''}
                      {attr.providerURI ? (
                        <a
                          href={attr.providerURI}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          {attr.provider}
                        </a>
                      ) : (
                        attr.provider
                      )}
                    </span>
                  ))}
                </p>
              )}
              <a
                href={resolvedPlace.googleMapsURI || MAPS_SEARCH_FALLBACK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-900 underline pt-0.5"
              >
                Petunjuk Arah di Google Maps
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}

export function FooterLocationMap() {
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim() || '';
  const [resolvedPlace, setResolvedPlace] = useState<ResolvedPlace | null>(null);
  const [hasError, setHasError] = useState(false);

  const mapsLink = resolvedPlace?.googleMapsURI || MAPS_SEARCH_FALLBACK_URL;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
      <div className="rounded-2xl border border-white/15 bg-slate-950/45 overflow-hidden shadow-lg">
        <div className="px-4 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-white/5">
          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300 shrink-0">
              <MapPin className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white">
                Peta Lokasi {SCHOOL_INFO.name}
              </p>
              <p className="text-[11px] text-slate-300 truncate sm:whitespace-normal">
                {SCHOOL_INFO.address}
              </p>
            </div>
          </div>

          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/35 text-xs font-bold text-sky-200 transition-colors shrink-0"
          >
            <Navigation className="w-3.5 h-3.5" />
            Buka Rute Google Maps
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {apiKey && !hasError ? (
          <APIProvider
            apiKey={apiKey}
            libraries={['places', 'marker']}
            language="id"
            region="ID"
          >
            <SchoolMapCanvas
              onResolvedPlace={setResolvedPlace}
              onResolveError={() => setHasError(false)}
            />
          </APIProvider>
        ) : (
          <div className="h-[220px] w-full flex flex-col items-center justify-center gap-3 px-6 text-center bg-slate-900/70">
            <div className="w-11 h-11 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="space-y-1 max-w-md">
              <p className="text-xs font-bold text-white">{SCHOOL_INFO.name}</p>
              <p className="text-xs text-slate-300 leading-relaxed">
                {SCHOOL_INFO.address}
              </p>
            </div>
            <a
              href={MAPS_SEARCH_FALLBACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              Lihat Lokasi di Google Maps
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
