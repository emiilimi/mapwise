import {
  defaultUrlTransform,
  type Components,
  type UrlTransform,
} from "react-markdown";

export const markdownComponents: Components = {
  a: ({ href, children, ...props }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  ),
};

// react-markdown v9 saniterer URL-er via `defaultUrlTransform`, som bare
// tillater http/https/ircs/mailto/xmpp. Det stripper `data:`-URI-er — så
// innlimte base64-bilder (`![](data:image/...)`) får tom `src` og forsvinner.
// Vi slipper gjennom `data:image/...` urørt, men beholder default-sanering for
// alt annet (så `javascript:`-lenker fortsatt blokkeres).
export const markdownUrlTransform: UrlTransform = (url) => {
  if (/^data:image\//i.test(url)) return url;
  return defaultUrlTransform(url);
};
