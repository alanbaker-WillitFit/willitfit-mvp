import Link from "next/link";
import DestinationMap from "@/components/fly/DestinationMap";
import styles from "@/components/fly/WillItFlyExperience.module.css";
import { getWillItFlyRuntimeBundle, resolveWillItFlyAsset } from "@/services/willitflyRuntime";
import type { RuntimeLayerCard, WillItFlyLayerId } from "@/lib/willitflyLayerEngine";

export const revalidate = 300;

const VALID_LAYERS = new Set<WillItFlyLayerId>(["LAYER_1", "LAYER_2", "LAYER_3", "LAYER_4"]);

function formatFlightTime(minutes: number): string {
  const rounded = Math.ceil(minutes / 30) * 30;
  const hours = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  if (hours && remainder) return `${hours}h ${remainder}m`;
  if (hours) return `${hours}h`;
  return `${remainder}m`;
}

function cardHref(card: RuntimeLayerCard, slug: string, routes: Awaited<ReturnType<typeof getWillItFlyRuntimeBundle>>["navigationRoutes"]): string | null {
  if (card.targetLayerId) {
    return `/?destination=${encodeURIComponent(slug)}&layer=${card.targetLayerId}&card=${encodeURIComponent(card.layerCardId)}#cards`;
  }
  if (card.targetRouteKey) {
    return routes.find((route) => route.routeKey === card.targetRouteKey)?.path ?? null;
  }
  return null;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ destination?: string; layer?: string; card?: string }>;
}) {
  const bundle = await getWillItFlyRuntimeBundle();
  const params = await searchParams;
  const selected = bundle.destinations.find((destination) => destination.slug === params.destination) ?? bundle.destinations[0] ?? null;
  const requestedLayer = params.layer as WillItFlyLayerId | undefined;
  const currentLayer: WillItFlyLayerId = requestedLayer && VALID_LAYERS.has(requestedLayer) ? requestedLayer : "LAYER_1";
  const layerCards = selected
    ? bundle.layerCards.filter((card) => card.destinationId === selected.destinationId && card.layerId === currentLayer)
    : [];
  const selectedCard = params.card ? bundle.layerCards.find((card) => card.layerCardId === params.card) ?? null : null;
  const dedicatedAsset = resolveWillItFlyAsset(bundle, selectedCard?.visualAssetId);
  const country = selected ? bundle.destinations.find((destination) => destination.destinationId === selected.countryId) ?? null : null;
  const region = selected?.regionId ? bundle.destinations.find((destination) => destination.destinationId === selected.regionId) ?? null : null;
  const travelTime = selected ? bundle.travelTimes.find((item) => item.destinationId === selected.destinationId) ?? null : null;
  const destinationsRoute = bundle.navigationRoutes.find((route) => route.routeKey === "DESTINATIONS") ?? null;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroIntro}>
            <span className={styles.eyebrow}>Destination guidance</span>
            <h1>Know Before You Go.</h1>
            <p>Choose a destination and get governed, practical travel facts without the noise.</p>
          </div>

          <div className={styles.searchPanel}>
            <form className={styles.searchForm} method="get">
              <select name="destination" defaultValue={selected?.slug ?? ""} disabled={bundle.destinations.length === 0} aria-label="Choose a destination">
                {bundle.destinations.length === 0 ? <option value="">No published destinations yet</option> : null}
                {bundle.destinations.map((destination) => (
                  <option key={destination.destinationId} value={destination.slug}>{destination.displayName}</option>
                ))}
              </select>
              <button type="submit" disabled={bundle.destinations.length === 0}>Show destination</button>
            </form>
          </div>

          <div className={styles.mapFrame}>
            {dedicatedAsset ? (
              <figure aria-label={dedicatedAsset.altText || dedicatedAsset.assetName}>
                <img src={dedicatedAsset.productionPath} alt={dedicatedAsset.altText || ""} style={{ display: "block", width: "100%", maxHeight: 520, objectFit: "contain" }} />
              </figure>
            ) : (
              <DestinationMap
                destinationName={selected?.displayName || "WillItFly"}
                latitude={selected?.latitude}
                longitude={selected?.longitude}
              />
            )}

            <aside className={styles.identityCard} aria-label="Destination identity">
              {selected ? (
                <>
                  <div className={styles.identityHeader}>
                    <span className={styles.flag} aria-hidden="true">{selected.displayFlagEmoji || country?.displayFlagEmoji || ""}</span>
                    <div>
                      <h2>{selected.displayName}</h2>
                      <p>{[region?.displayName, country?.displayName].filter(Boolean).join(" · ") || selected.destinationType}</p>
                    </div>
                  </div>
                  {travelTime ? <p className={styles.identityMeta}>From {travelTime.originDisplayName}: about {formatFlightTime(travelTime.averageFlightMinutes)}</p> : null}
                  {destinationsRoute ? <Link className={styles.hierarchyLink} href={destinationsRoute.path}>More destination options →</Link> : null}
                </>
              ) : (
                <p className={styles.emptyNote}>{bundle.configured ? "No authorised destination is published yet." : "WillItFly Runtime is not configured for this build."}</p>
              )}
            </aside>
          </div>
        </div>
      </section>

      <section id="cards" className={styles.cardsSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.eyebrow}>Layer {currentLayer.replace("LAYER_", "")}</span>
              <h2>{selected ? `What to know about ${selected.displayName}` : "Travel facts"}</h2>
            </div>
            <p>Up to 10 governed cards. Desktop shows up to 5 at once.</p>
          </div>

          {layerCards.length > 0 ? (
            <div className={styles.cardRail} aria-label="Destination advice cards">
              {layerCards.map((card) => {
                const href = selected ? cardHref(card, selected.slug, bundle.navigationRoutes) : null;
                const content = (
                  <>
                    <span className={styles.cardPosition}>{card.position}</span>
                    <span className={styles.cardType}>{card.cardType}</span>
                    <h3>{card.cardTitle}</h3>
                    {card.summary ? <p>{card.summary}</p> : null}
                    {href ? <span className={styles.cardArrow}>Open →</span> : null}
                  </>
                );
                return href ? <Link key={card.layerCardId} href={href} className={styles.layerCard}>{content}</Link> : <article key={card.layerCardId} className={styles.layerCard}>{content}</article>;
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              {selected ? "No cards are currently authorised for this destination and layer." : "Destination cards will appear when governed Runtime records are available."}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
