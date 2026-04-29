const ENV = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

const GA_ID = ENV.VITE_GA_ID;
const UMAMI_WEBSITE_ID = ENV.VITE_UMAMI_WEBSITE_ID;
const UMAMI_SRC = ENV.VITE_UMAMI_SRC ?? "https://cloud.umami.is/script.js";

export function Analytics() {
  return (
    <>
      {GA_ID ? (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
          <script
            // biome-ignore lint/security/noDangerouslySetInnerHtml: gtag init snippet
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`,
            }}
          />
        </>
      ) : null}
      {UMAMI_WEBSITE_ID ? (
        <script defer src={UMAMI_SRC} data-website-id={UMAMI_WEBSITE_ID} />
      ) : null}
    </>
  );
}
