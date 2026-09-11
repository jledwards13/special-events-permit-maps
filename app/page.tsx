"use client";
import { useCallback, useRef, useState } from "react";
import StreetMap, { StreetMapHandle } from "./StreetMap";
type ToolKind =
  | "tent10x10"
  | "tent10x20"
  | "tent20x30"
  | "stage"
  | "truck"
  | "barricade"
  | "table"
  | "restroom"
  | "generator"
  | "entry"
  | "arrow"
  | "note";
type LocationKey =
  | "government-plaza"
  | "alberta"
  | "annette-shelby"
  | "burrell-odom"
  | "jaycee"
  | "kaulton"
  | "parker-haun"
  | "randall-family"
  | "snow-hinton"
  | "springbrook"
  | "riverwalk"
  | "city-streets";
type PlacedItem = {
  id: number;
  kind: ToolKind;
  x: number;
  y: number;
  lat?: number;
  lng?: number;
  label: string;
  rotation: number;
  width: number;
  height: number;
  color: string;
};
const tools: { kind: ToolKind; name: string; short: string; color: string }[] =
  [
    {
      kind: "tent10x10",
      name: "10 × 10 Tent",
      short: "10×10",
      color: "#176b55",
    },
    {
      kind: "tent10x20",
      name: "10 × 20 Tent",
      short: "10×20",
      color: "#2f7d5a",
    },
    {
      kind: "tent20x30",
      name: "20 × 30 Tent",
      short: "20×30",
      color: "#527a55",
    },
    {
      kind: "stage",
      name: "Stage / Entertainment",
      short: "▰",
      color: "#7c3aed",
    },
    { kind: "truck", name: "Food Truck", short: "▰●", color: "#c2410c" },
    { kind: "barricade", name: "Barricade", short: "╱╱╱", color: "#c1121f" },
    { kind: "table", name: "Table / Booth", short: "▭", color: "#1565c0" },
    {
      kind: "restroom",
      name: "Portable Restroom",
      short: "▯",
      color: "#0e7490",
    },
    { kind: "generator", name: "Generator", short: "⚡", color: "#a16207" },
    { kind: "entry", name: "Entrance / Exit", short: "→", color: "#15803d" },
    { kind: "arrow", name: "Directional Arrow", short: "➜", color: "#1d4ed8" },
    { kind: "note", name: "Insert Text", short: "T", color: "#ffffff" },
  ];
const locations: Record<
  LocationKey,
  {
    name: string;
    simple: string;
    satellite: string;
    alt: string;
    roads: boolean;
    ratio: number;
    rates: string[];
  }
> = {
  "government-plaza": {
    name: "Government Plaza",
    simple: "/government-plaza-aerial.jpeg",
    satellite: "/government-plaza-satellite.jpeg",
    alt: "Government Plaza",
    roads: true,
    ratio: 1.447,
    rates: [
      "Bicentennial area: $100/hr ($400 minimum) or $800/day",
      "Entire park: $250/hr ($1,000 minimum) or $2,000/day",
    ],
  },
  alberta: {
    name: "Alberta Park",
    simple: "",
    satellite: "/alberta-park-satellite.jpeg",
    alt: "Alberta Park",
    roads: false,
    ratio: 1.535,
    rates: ["$100/hr ($400 minimum) or $800/day"],
  },
  "annette-shelby": {
    name: "Annette–Shelby Park",
    simple: "",
    satellite: "/annette-shelby-park-satellite.jpeg",
    alt: "Annette–Shelby Park",
    roads: false,
    ratio: 1.599,
    rates: ["Entire park: $200/hr ($800 minimum) or $1,500/day"],
  },
  "burrell-odom": {
    name: "Burrell Odom Park",
    simple: "",
    satellite: "/burrell-odom-park-satellite.jpeg",
    alt: "Burrell Odom Park",
    roads: false,
    ratio: 1.351,
    rates: ["$100/hr ($400 minimum) or $800/day"],
  },
  jaycee: {
    name: "Jaycee Park",
    simple: "",
    satellite: "/jaycee-park-satellite.jpeg",
    alt: "Jaycee Park",
    roads: false,
    ratio: 1.253,
    rates: ["$200/hr ($800 minimum) or $1,500/day"],
  },
  kaulton: {
    name: "Kaulton Park",
    simple: "",
    satellite: "/kaulton-park-satellite.jpeg",
    alt: "Kaulton Park",
    roads: false,
    ratio: 1.71,
    rates: [
      "Entire park: $100/hr ($400 minimum) or $800/day",
      "Pavilion: $30/hr ($120 minimum)",
    ],
  },
  "parker-haun": {
    name: "Parker–Haun Park",
    simple: "",
    satellite: "/parker-haun-park-satellite.jpeg",
    alt: "Parker–Haun Park",
    roads: false,
    ratio: 1.545,
    rates: ["$200/hr ($800 minimum) or $1,500/day"],
  },
  "randall-family": {
    name: "Randall Family Park",
    simple: "",
    satellite: "/randall-family-park-satellite.jpeg",
    alt: "Randall Family Park",
    roads: false,
    ratio: 1.645,
    rates: ["$150/hr ($600 minimum) or $1,200/day"],
  },
  "snow-hinton": {
    name: "Snow Hinton Park",
    simple: "",
    satellite: "/snow-hinton-park-satellite.jpeg",
    alt: "Snow Hinton Park",
    roads: false,
    ratio: 0.907,
    rates: [
      "Ellipse: $375/hr ($1,500 minimum) or $3,000/day",
      "Entire park: $500/hr ($2,000 minimum) or $4,000/day",
      "Ellipse Pavilion: $75/hr ($300 minimum)",
      "Playground Pavilion: $50/hr ($200 minimum)",
    ],
  },
  springbrook: {
    name: "Springbrook Park",
    simple: "",
    satellite: "/springbrook-park-satellite-renovated.png",
    alt: "Updated overhead aerial view of renovated Springbrook Park",
    roads: false,
    ratio: 1.887,
    rates: ["$100/hr ($400 minimum)"],
  },
  riverwalk: {
    name: "Tuscaloosa Riverwalk",
    simple: "",
    satellite: "",
    alt: "Tuscaloosa Riverwalk",
    roads: false,
    ratio: 1.447,
    rates: [
      "$25 permit for equipment setup, groups of 30 or more, and walks, runs, or parades",
      "Exclusive use of the Riverwalk is not permitted",
    ],
  },
  "city-streets": {
    name: "City Streets",
    simple: "",
    satellite: "",
    alt: "Tuscaloosa city streets",
    roads: false,
    ratio: 1.447,
    rates: [],
  },
};
const parkOptions: { name: string; key?: LocationKey }[] = [
  { name: "Alberta Park", key: "alberta" },
  { name: "Annette–Shelby Park", key: "annette-shelby" },
  { name: "Burrell Odom Park", key: "burrell-odom" },
  { name: "Jaycee Park", key: "jaycee" },
  { name: "Kaulton Park", key: "kaulton" },
  { name: "Parker–Haun Park", key: "parker-haun" },
  { name: "Randall Family Park", key: "randall-family" },
  { name: "Snow Hinton Park", key: "snow-hinton" },
  { name: "Springbrook Park", key: "springbrook" },
];
export default function Home() {
  const mapRef = useRef<HTMLDivElement>(null);
  const streetMapRef = useRef<StreetMapHandle>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<PlacedItem[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [counter, setCounter] = useState(1);
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [notes, setNotes] = useState("");
  const [mapView, setMapView] = useState<"simple" | "satellite">("simple");
  const [location, setLocation] = useState<LocationKey>("government-plaza");
  const [, setMapRevision] = useState(0);
  const mapIsInteractive =
    location === "city-streets" || location === "riverwalk";
  const selectedItem = items.find((i) => i.id === selected);
  const legendItems = items.filter(
    (item, index) =>
      !item.kind.startsWith("tent") ||
      items.findIndex((other) => other.kind === item.kind) === index,
  );
  const activeLocation = locations[location];
  const handleMapViewChange = useCallback(
    () => setMapRevision((v) => v + 1),
    [],
  );
  const addItem = (kind: ToolKind, x = 50, y = 50) => {
    const d = tools.find((t) => t.kind === kind)!;
    const defaults =
      kind === "tent10x10"
        ? { width: 28, height: 28 }
        : kind === "tent10x20"
          ? { width: 56, height: 28 }
          : kind === "tent20x30"
            ? { width: 84, height: 56 }
            : kind === "barricade"
              ? { width: 100, height: 22 }
              : kind === "restroom"
                ? { width: 42, height: 62 }
                : kind === "generator"
                  ? { width: 52, height: 52 }
                  : kind === "truck"
                    ? { width: 105, height: 48 }
                    : kind === "stage"
                      ? { width: 110, height: 58 }
                      : kind === "entry"
                        ? { width: 76, height: 38 }
                        : kind === "arrow"
                          ? { width: 130, height: 52 }
                          : kind === "note"
                            ? { width: 100, height: 38 }
                            : { width: 76, height: 42 };
    const geo = mapIsInteractive
      ? streetMapRef.current?.percentToLatLng(x, y)
      : null;
    const next = {
      id: counter,
      kind,
      x,
      y,
      ...(geo ? geo : {}),
      label:
        kind === "note"
          ? "Text"
          : kind === "arrow"
            ? "Traffic direction"
            : d.name,
      rotation: 0,
      color: d.color,
      ...defaults,
    };
    setCounter((v) => v + 1);
    setItems((c) => [...c, next]);
    setSelected(next.id);
    if (kind === "note" || kind === "arrow")
      setTimeout(() => labelInputRef.current?.select(), 0);
  };
const updateSelected = (patch: Partial<PlacedItem>) => {
    if (selected === null) return;
    setItems((c) => c.map((i) => (i.id === selected ? { ...i, ...patch } : i)));
};
  const nudgeSelected = (dx: number, dy: number) => {
    if (!selectedItem) return;
    const anchored = selectedItem.lat !== undefined && selectedItem.lng !== undefined
      ? streetMapRef.current?.latLngToPercent(selectedItem.lat, selectedItem.lng)
      : null;
    const x = (anchored?.x ?? selectedItem.x) + dx;
    const y = (anchored?.y ?? selectedItem.y) + dy;
    const geo = mapIsInteractive ? streetMapRef.current?.percentToLatLng(x, y) : null;
    updateSelected({ x, y, ...(geo ? geo : {}) });
  };
  const duplicateItem = (item: PlacedItem) => {
    const anchored = item.lat !== undefined && item.lng !== undefined
      ? streetMapRef.current?.latLngToPercent(item.lat, item.lng)
      : null;
    const x = Math.min(96, (anchored?.x ?? item.x) + 3);
    const y = Math.min(96, (anchored?.y ?? item.y) + 3);
    const geo = mapIsInteractive ? streetMapRef.current?.percentToLatLng(x, y) : null;
    const copy = {
      ...item,
      id: counter,
      x,
      y,
      ...(geo ? geo : {}),
    };
    setCounter((v) => v + 1);
    setItems((c) => [...c, copy]);
    setSelected(copy.id);
  };
  const changeLocation = (next: LocationKey) => {
    if (next === location) return;
    if (
      items.length &&
      !confirm(
        "Switch locations and clear the setup items currently on this map?",
      )
    )
      return;
    setLocation(next);
    setItems([]);
    setSelected(null);
    setMapView(next === "government-plaza" ? "simple" : "satellite");
  };
  const pointerDown = (event: React.PointerEvent, item: PlacedItem) => {
    event.preventDefault();
    event.stopPropagation();
    setSelected(item.id);
    const target = event.currentTarget as HTMLElement;
    target.setPointerCapture(event.pointerId);
    const move = (e: PointerEvent) => {
      const r = mapRef.current?.getBoundingClientRect();
      if (!r) return;
      const x = Math.max(
        2,
        Math.min(98, ((e.clientX - r.left) / r.width) * 100),
      );
      const y = Math.max(
        2,
        Math.min(98, ((e.clientY - r.top) / r.height) * 100),
      );
      const geo = mapIsInteractive
        ? streetMapRef.current?.percentToLatLng(x, y)
        : null;
      setItems((c) =>
        c.map((p) =>
          p.id === item.id ? { ...p, x, y, ...(geo ? geo : {}) } : p,
        ),
      );
    };
    const up = () => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", up);
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", up);
  };
  const resizePointerDown = (event: React.PointerEvent, item: PlacedItem) => {
    event.preventDefault();
    event.stopPropagation();
    setSelected(item.id);
    const target = event.currentTarget as HTMLElement;
    const startX = event.clientX,
      startY = event.clientY,
      startWidth = item.width,
      startHeight = item.height;
    target.setPointerCapture(event.pointerId);
    const move = (e: PointerEvent) => {
      const width = Math.max(
        30,
        Math.min(300, startWidth + e.clientX - startX),
      );
      const height = Math.max(
        20,
        Math.min(220, startHeight + e.clientY - startY),
      );
      setItems((c) =>
        c.map((p) => (p.id === item.id ? { ...p, width, height } : p)),
      );
    };
    const up = () => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", up);
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", up);
  };
  const rotatePointerDown = (event: React.PointerEvent, item: PlacedItem) => {
    event.preventDefault();
    event.stopPropagation();
    setSelected(item.id);
    const target = event.currentTarget as HTMLElement;
    const shell = target.parentElement;
    if (!shell) return;
    const rect = shell.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2,
      centerY = rect.top + rect.height / 2;
    const startAngle =
      (Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) /
      Math.PI;
    const startRotation = item.rotation;
    target.setPointerCapture(event.pointerId);
    const move = (e: PointerEvent) => {
      const angle =
        (Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180) / Math.PI;
      let rotation = Math.round(startRotation + angle - startAngle);
      rotation = ((((rotation + 180) % 360) + 360) % 360) - 180;
      setItems((c) =>
        c.map((p) => (p.id === item.id ? { ...p, rotation } : p)),
      );
    };
    const up = () => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", up);
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", up);
  };
  const textColor = (hex: string) => {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.slice(0, 2), 16),
      g = parseInt(clean.slice(2, 4), 16),
      b = parseInt(clean.slice(4, 6), 16);
    return r * 299 + g * 587 + b * 114 > 150000 ? "#17212b" : "#ffffff";
  };
  return (
    <main>
      <header className="cityHeader">
        <div>
          <p>CITY OF TUSCALOOSA</p>
          <h1>Special Event Site Plan Builder</h1>
        </div>
        <button
          className="printButton"
          onClick={() => {
            streetMapRef.current?.refreshLayout();
            requestAnimationFrame(() =>
              requestAnimationFrame(() => window.print()),
            );
          }}
        >
          Download / Print PDF
        </button>
      </header>
      <nav className="locationBar" aria-label="Choose permit location">
        <button
          className={location === "government-plaza" ? "active" : ""}
          onClick={() => changeLocation("government-plaza")}
        >
          <b>Government Plaza</b>
          <small>Downtown plaza</small>
        </button>
        <label>
          City Parks
          <select
            value={
              location === "government-plaza" ||
              location === "city-streets" ||
              location === "riverwalk"
                ? ""
                : location
            }
            onChange={(e) => {
              if (e.target.value) changeLocation(e.target.value as LocationKey);
            }}
          >
            <option value="">Choose a park</option>
            {parkOptions.map((park) => (
              <option key={park.name} value={park.key}>
                {park.name}
              </option>
            ))}
          </select>
        </label>
        <button
          className={location === "riverwalk" ? "active" : ""}
          onClick={() => changeLocation("riverwalk")}
        >
          <b>Riverwalk</b>
          <small>Cleanups, Cypress Shelter &amp; Red Pavilion</small>
        </button>
        <button
          className={location === "city-streets" ? "active" : ""}
          onClick={() => changeLocation("city-streets")}
        >
          <b>City Streets</b>
          <small>Search and mark affected streets</small>
        </button>
      </nav>
      <section className="eventBar">
        <label>
          Event name
          <input
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="Example: Community Festival"
          />
          <span className="printValue">{eventName || "Not provided"}</span>
        </label>
        <label>
          Event date
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
          <span className="printValue">{eventDate || "Not provided"}</span>
        </label>
        <label>
          Organizer
          <input
            value={organizer}
            onChange={(e) => setOrganizer(e.target.value)}
            placeholder="Organization or contact"
          />
          <span className="printValue">{organizer || "Not provided"}</span>
        </label>
      </section>
      <div className="workspace">
        <aside className="toolPanel">
          <h2>Add setup items</h2>
          <p>Choose an item, then drag it into position on the map.</p>
          <div className="toolGrid">
            {tools.map((t) => (
              <button key={t.kind} onClick={() => addItem(t.kind)}>
                <span
                  className="toolIcon"
                  style={{
                    background: t.kind === "note" ? "#fff" : t.color,
                    color: t.kind === "note" ? "#374151" : "#fff",
                  }}
                >
                  {t.short}
                </span>
                {t.name}
              </button>
            ))}
          </div>
          <small className="scaleNote">
            Tent presets use consistent proportional footprints: 10×10, 10×20,
            and 20×30.
          </small>
          <div className="instructions">
            <b>Map tips</b>
            <ol>
              <li>Add each setup item.</li>
              <li>Click once to keep its editing controls open.</li>
              <li>Double-click an item to edit its text.</li>
              <li>Drag items into position, then resize or rotate them.</li>
              <li>Print or save the finished plan as a PDF.</li>
            </ol>
          </div>
        </aside>
        <section className="mapSection">
          <div className="mapHeading">
            <div>
              <h2>{activeLocation.name} Site Plan</h2>
              <p>
                {mapIsInteractive
                  ? "Pan or zoom freely—placed items remain anchored to their map location"
                  : activeLocation.roads
                    ? "North is at the top • Road labels are for orientation"
                    : "North is at the top • Satellite view for site recognition"}
              </p>
            </div>
            {location === "government-plaza" && (
              <div
                className="viewToggle"
                role="group"
                aria-label="Map background"
              >
                <button
                  className={mapView === "simple" ? "active" : ""}
                  onClick={() => setMapView("simple")}
                >
                  Simple Map
                </button>
                <button
                  className={mapView === "satellite" ? "active" : ""}
                  onClick={() => setMapView("satellite")}
                >
                  Satellite
                </button>
              </div>
            )}
            <div className="north">
              ↑<span>N</span>
            </div>
          </div>
          <div
            className={`mapFrame location-${location}`}
            style={{ aspectRatio: activeLocation.ratio }}
            ref={mapRef}
            onClick={() => setSelected(null)}
          >
            {mapIsInteractive ? (
              <StreetMap
                ref={streetMapRef}
                mode={location === "riverwalk" ? "riverwalk" : "streets"}
                onViewChange={handleMapViewChange}
              />
            ) : (
              <img
                src={
                  location === "government-plaza" && mapView === "simple"
                    ? activeLocation.simple
                    : activeLocation.satellite
                }
                alt={`${location === "government-plaza" && mapView === "simple" ? "Simplified site plan" : "Satellite view"} of ${activeLocation.alt}`}
              />
            )}{" "}
            {activeLocation.roads && (
              <>
                <span className="road roadTop">7TH STREET</span>
                <span className="road roadBottom">6TH STREET</span>
                <span className="road roadRight">21ST AVENUE</span>
              </>
            )}
            {items.map((item) => {
              const t = tools.find((a) => a.kind === item.kind)!;
              const anchored = item.lat !== undefined && item.lng !== undefined
                ? streetMapRef.current?.latLngToPercent(item.lat, item.lng)
                : null;
              const displayX = anchored?.x ?? item.x;
              const displayY = anchored?.y ?? item.y;
              return (
                <div
                  key={item.id}
                  className={`itemShell ${selected === item.id ? "selected" : ""}`}
                  style={{
                    left: `${displayX}%`,
                    top: `${displayY}%`,
                    width: `${item.width}px`,
                    height: `${item.height}px`,
                    transform: `translate(-50%,-50%) rotate(${item.rotation}deg)`,
                  }}
                >
                  <button
                    className={`mapItem kind-${item.kind} ${item.kind.startsWith("tent") ? "tentPreset" : ""}`}
                    style={{
                      background:
                        item.kind === "barricade"
                          ? `repeating-linear-gradient(135deg,${item.color} 0 10px,#fff 10px 15px)`
                          : item.color,
                      color: textColor(item.color),
                    }}
                    onPointerDown={(e) => pointerDown(e, item)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected(item.id);
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setSelected(item.id);
                      setTimeout(() => labelInputRef.current?.select(), 0);
                    }}
                    onContextMenu={(e) => e.preventDefault()}
                    title="Click to edit • Drag to move"
                  >
                    {item.kind !== "note" && <span>{t.short}</span>}
                    <em className={item.kind === "note" ? "textOnly" : ""}>
                      {item.label}
                    </em>
                  </button>
                  {selected === item.id && (
                    <>
                      <span
                        className="rotateHandle"
                        onPointerDown={(e) => rotatePointerDown(e, item)}
                        title="Drag to rotate"
                        aria-label="Drag to rotate"
                      >
                        ↻
                      </span>
                      <button
                        className="duplicateHandle"
                        onPointerDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateItem(item);
                        }}
                        title="Duplicate item"
                        aria-label="Duplicate item"
                      >
                        ⧉
                      </button>
                      {!item.kind.startsWith("tent") && (
                        <span
                          className="resizeHandle"
                          onPointerDown={(e) => resizePointerDown(e, item)}
                          title="Drag to resize"
                          aria-label="Drag to resize"
                        />
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <div className="legend">
            <b>Plan legend</b>
            {items.length === 0 ? (
              <span className="legendEmpty">Added items will appear here</span>
            ) : (
              legendItems.map((item, index) => (
                <span key={item.id}>
                  <i
                    style={{
                      background: item.color,
                      color: item.color,
                      borderColor: item.color,
                    }}
                  />
                  {item.label || `Item ${index + 1}`}
                </span>
              ))
            )}
          </div>
        </section>
        <aside className="detailPanel">
          <h2>Selected item</h2>
          {selectedItem ? (
            <>
              <label>
                {selectedItem.kind === "note" ? "Text" : "Legend label"}
                <input
                  ref={labelInputRef}
                  value={selectedItem.label}
                  onChange={(e) => updateSelected({ label: e.target.value })}
                />
              </label>
              <label className="colorControl">
                Box color
                <div>
                  <input
                    type="color"
                    value={selectedItem.color}
                    onChange={(e) => updateSelected({ color: e.target.value })}
                  />
                  <span>{selectedItem.color.toUpperCase()}</span>
                </div>
              </label>
              <p className="resizeHint">
                {selectedItem.kind.startsWith("tent")
                  ? "Tent footprint is locked to its listed dimensions. Rotate it with the circular arrow or use the copy button to duplicate it."
                  : "Drag the yellow corner to resize, use the circular arrow to rotate, or select the copy button to duplicate."}
              </p>
              <label>
                Rotation: {selectedItem.rotation}°
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={selectedItem.rotation}
                  onChange={(e) =>
                    updateSelected({ rotation: Number(e.target.value) })
                  }
                />
              </label>
              <div className="nudge">
                <button
                  onClick={() => nudgeSelected(0, -1)}
                >
                  ↑
                </button>
                <button
                  onClick={() => nudgeSelected(-1, 0)}
                >
                  ←
                </button>
                <button
                  onClick={() => nudgeSelected(0, 1)}
                >
                  ↓
                </button>
                <button
                  onClick={() => nudgeSelected(1, 0)}
                >
                  →
                </button>
              </div>
              <button
                className="delete"
                onClick={() => {
                  setItems((c) => c.filter((i) => i.id !== selected));
                  setSelected(null);
                }}
              >
                Remove item
              </button>
            </>
          ) : (
            <p className="empty">
              Select an item on the map to edit its label, color, direction, or
              placement.
            </p>
          )}
          <label className="notes">
            General setup notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Include dimensions, access instructions, power needs, or other information…"
            />
          </label>
          {(["snow-hinton", "kaulton"] as LocationKey[]).includes(location) && (
            <section className="mapNotice">
              <b>Map update notice</b>
              <p>Renovations have taken place at this park. Some features shown on the aerial map may differ from the current site.</p>
            </section>
          )}
          {location === "city-streets" ? (
            <section className="ratePanel streetInfo">
              <h3>Street Plan Review</h3>
              <p>The gold dashed line shows the City boundary for reference.</p>
              <p>
                Identify closures, barricades, access points, and the direction
                of traffic in the setup notes.
              </p>
              <small>
                Final jurisdiction and traffic-control requirements are subject
                to City confirmation.
              </small>
            </section>
          ) : (
            <section
              className="ratePanel"
              aria-label={`${activeLocation.name} rental rates`}
            >
              <h3>{activeLocation.name} Rental Rates</h3>
              {activeLocation.rates.map((rate) => (
                <p key={rate}>{rate}</p>
              ))}
              <small>Rates shown are subject to City confirmation.</small>
            </section>
          )}
          <button
            className="clear"
            onClick={() => {
              if (confirm("Clear every item from this plan?")) setItems([]);
            }}
          >
            Clear map
          </button>
        </aside>
      </div>
      <footer>
        This planning tool is for permit review and does not itself constitute
        approval. Keep fire lanes, sidewalks, building access, and accessible
        routes clear.
      </footer>
    </main>
  );
}
