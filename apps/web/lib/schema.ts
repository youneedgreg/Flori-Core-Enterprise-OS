import { ID, SITE_NAME, SITE_URL, absolute } from "./site";

/** Referenced by @id from every page, so the graph describes one entity. */
export const organization = {
  "@type": "Organization",
  "@id": ID.organization,
  name: SITE_NAME,
  legalName: SITE_NAME,
  url: `${SITE_URL}/`,
  logo: { "@type": "ImageObject", url: absolute("/icon.svg") },
  image: absolute("/opengraph-image.png"),
  description:
    "Flori-Core builds Enterprise OS, a single system of record for commercial flower farms — production, pack house, cold chain, logistics, sales, payroll and compliance.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Naivasha",
    addressRegion: "Nakuru",
    addressCountry: "KE",
  },
  areaServed: { "@type": "Country", name: "Kenya" },
  knowsAbout: [
    "Floriculture",
    "Flower farm management",
    "Cold chain logistics",
    "GlobalG.A.P record keeping",
    "Agricultural ERP",
  ],
};

export const website = {
  "@type": "WebSite",
  "@id": ID.website,
  url: `${SITE_URL}/`,
  name: SITE_NAME,
  inLanguage: "en-KE",
  publisher: { "@id": ID.organization },
};

export const software = {
  "@type": "SoftwareApplication",
  "@id": ID.software,
  name: "Flori-Core Enterprise OS",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Farm management software",
  operatingSystem: "Web browser",
  url: `${SITE_URL}/`,
  publisher: { "@id": ID.organization },
  description:
    "One system of record for commercial flower farms: seventeen modules across production, measurement, logistics, trade and back office, sharing a single database.",
  audience: { "@type": "BusinessAudience", audienceType: "Commercial flower farms" },
  featureList: [
    "Farm zones and crop cycle management",
    "IoT telemetry over MQTT and automation rules",
    "Pack house grading and cold room monitoring",
    "Inventory and Available-to-Promise by variety",
    "Logistics and dispatch to JKIA",
    "Sales CRM and procurement",
    "Multi-currency financials in KES, USD and EUR",
    "Payroll with NSSF, NHIF and PAYE deductions",
    "Certificate registry, spray logs and immutable audit trail",
  ],
};

export function webPage(opts: {
  path: string;
  name: string;
  description: string;
  type?: "WebPage" | "ContactPage" | "AboutPage";
}) {
  const url = `${SITE_URL}${opts.path}`;
  return {
    "@type": opts.type ?? "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: opts.name,
    description: opts.description,
    isPartOf: { "@id": ID.website },
    about: { "@id": ID.software },
    inLanguage: "en-KE",
    primaryImageOfPage: { "@type": "ImageObject", url: absolute("/opengraph-image.png") },
  };
}

export function breadcrumbs(trail: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: `${SITE_URL}${t.path}`,
    })),
  };
}

export function graph(nodes: object[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}
