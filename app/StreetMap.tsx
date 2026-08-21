"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type SearchResult = {
  display_name: string;
  lat: string;
  lon: string;
};

const boundaryUrl = "https://services.arcgis.com/AWzSDaKZ41uuVges/ArcGIS/rest/services/City_and_Town_Limits/FeatureServer/0/query?where=CITY%3D%27TUSCALOOSA%20CITY%20LIMITS%27&outFields=CITY&outSR=4326&f=geojson";
const baseMaps = {
  streets: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    options: { maxZoom: 20, attribution: "&copy; OpenStreetMap contributors" },
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    options: { maxZoom: 20, attribution: "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community" },
  },
};

export default function StreetMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const baseLayer = useRef<any>(null);
  const searchMarker = useRef<any>(null);
  const [baseView, setBaseView] = useState<keyof typeof baseMaps>("streets");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("Search an address or move the map to the permitted street area.");

  useEffect(() => {
    let active = true;
    import("leaflet").then((leaflet) => {
      if (!active || !containerRef.current || mapInstance.current) return;
      const L = leaflet.default;
      const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true }).setView([33.2098, -87.5692], 13);
      mapInstance.current = map;
      baseLayer.current = L.tileLayer(baseMaps.streets.url, baseMaps.streets.options).addTo(map);
      fetch(boundaryUrl)
        .then((response) => response.json())
        .then((geojson) => {
          if (!active) return;
          L.geoJSON(geojson, {
            style: { color: "#d7a638", weight: 3, opacity: 0.95, fillColor: "#d7a638", fillOpacity: 0.035, dashArray: "8 6" },
          }).addTo(map).bindTooltip("Tuscaloosa city limits", { sticky: true });
        })
        .catch(() => setMessage("City boundary overlay is unavailable. Confirm the address with the official City Limits Map."));
      setTimeout(() => map.invalidateSize(), 0);
    });
    return () => {
      active = false;
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    let active = true;
    import("leaflet").then((leaflet) => {
      if (!active || !mapInstance.current) return;
      const selected = baseMaps[baseView];
      baseLayer.current?.remove();
      baseLayer.current = leaflet.default.tileLayer(selected.url, selected.options).addTo(map);
      baseLayer.current.bringToBack?.();
    });
    return () => { active = false; };
  }, [baseView]);

  useEffect(() => {
    const refreshMapLayout = () => {
      const map = mapInstance.current;
      if (!map) return;
      const center = map.getCenter();
      const zoom = map.getZoom();
      map.invalidateSize({ animate: false, pan: false });
      map.setView(center, zoom, { animate: false });
    };
    const printMedia = window.matchMedia("print");
    const handlePrintMedia = (event: MediaQueryListEvent) => {
      if (event.matches) refreshMapLayout();
    };
    window.addEventListener("beforeprint", refreshMapLayout);
    window.addEventListener("afterprint", refreshMapLayout);
    printMedia.addEventListener("change", handlePrintMedia);
    return () => {
      window.removeEventListener("beforeprint", refreshMapLayout);
      window.removeEventListener("afterprint", refreshMapLayout);
      printMedia.removeEventListener("change", handlePrintMedia);
    };
  }, []);

  const search = async (event: FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setMessage("Searching…");
    try {
      const term = /tuscaloosa/i.test(query) ? query : `${query}, Tuscaloosa, Alabama`;
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=us&q=${encodeURIComponent(term)}`);
      const data = (await response.json()) as SearchResult[];
      setResults(data);
      setMessage(data.length ? "Choose the matching address below." : "No matching Tuscaloosa address was found.");
    } catch {
      setMessage("Address search is temporarily unavailable. You can still pan and zoom to the street.");
    } finally {
      setSearching(false);
    }
  };

  const chooseResult = async (result: SearchResult) => {
    const L = (await import("leaflet")).default;
    const lat = Number(result.lat);
    const lon = Number(result.lon);
    const map = mapInstance.current;
    if (!map) return;
    map.setView([lat, lon], 18);
    searchMarker.current?.remove();
    searchMarker.current = L.circleMarker([lat, lon], {
      radius: 8,
      color: "#ffffff",
      weight: 3,
      fillColor: "#c1121f",
      fillOpacity: 1,
    }).addTo(map);
    setResults([]);
    setQuery(result.display_name.split(",").slice(0, 3).join(","));
    setMessage("Address located. Add and position setup items over the affected streets.");
  };

  return <>
    <div ref={containerRef} className="leafletMap" aria-label="Interactive map of Tuscaloosa city streets" />
    <div className="streetViewToggle" role="group" aria-label="City Streets map view" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
      <button type="button" className={baseView === "streets" ? "active" : ""} aria-pressed={baseView === "streets"} onClick={() => setBaseView("streets")}>Street Map</button>
      <button type="button" className={baseView === "satellite" ? "active" : ""} aria-pressed={baseView === "satellite"} onClick={() => setBaseView("satellite")}>Satellite</button>
    </div>
    <div className="streetSearch" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
      <form onSubmit={search}>
        <label htmlFor="street-address">Find an address or street</label>
        <div><input id="street-address" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Example: 2230 7th Street"/><button disabled={searching}>{searching ? "Searching" : "Search"}</button></div>
      </form>
      {results.length > 0 && <div className="streetResults">{results.map((result) => <button key={`${result.lat}-${result.lon}`} onClick={() => chooseResult(result)}>{result.display_name}</button>)}</div>}
      <p>{message}</p>
    </div>
    <div className="boundaryKey"><i/> Tuscaloosa city limits</div>
  </>;
}
