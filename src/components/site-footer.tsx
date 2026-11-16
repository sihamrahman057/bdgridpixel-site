import type { EventSettings } from "@/lib/types";
import { DiscordIcon, FacebookIcon, InstagramIcon, YoutubeIcon } from "@/components/social-icons";

export function SiteFooter({ settings }: { settings: EventSettings }) {
  const links = [
    { href: settings.socialDiscord, label: "Discord", Icon: DiscordIcon },
    { href: settings.socialInstagram, label: "Instagram", Icon: InstagramIcon },
    { href: settings.socialYoutube, label: "YouTube", Icon: YoutubeIcon },
    { href: settings.socialFacebook, label: "Facebook", Icon: FacebookIcon },
  ].filter((link) => link.href);

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        {links.length > 0 ? (
          <ul className="site-socials" aria-label="Social links">
            {links.map(({ href, label, Icon }) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noopener noreferrer" className="site-social" aria-label={label}>
                  <Icon className="size-5" />
                </a>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="site-credit">Owned by BDGridPixel</p>
      </div>
    </footer>
  );
}
