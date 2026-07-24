import { hexToRgba } from "@/utils/colorUtils";

// Presentational widget card — icon + platform label + URL, styled either
// from the platform's own brand color or the profile card's own theme.
// Reused unmodified in WidgetModal's preview pane, SettingsWidgets' list,
// and Profile.jsx's public hero card. `preview` renders a <div> instead of
// a live <a> so the modal's staged preview isn't a dead link mid-edit.
// `showLabel` swaps the main line from the raw URL to the platform's name
// (used on the public profile card, where a bare link looks noisy).
export default function WidgetCard({
  platform,
  url,
  options,
  cardTheme,
  preview = false,
  showLabel = false,
}) {
  const Icon = platform.icon;
  const extraOn = !!options?.[platform.extraOptionKey];

  const containerStyle = options?.useCardStyle
    ? {
        backgroundColor: hexToRgba(
          cardTheme?.cardColor,
          cardTheme?.cardOpacity,
        ),
        borderRadius: `${cardTheme?.cornerRoundness ?? 16}px`,
      }
    : {
        // Solid-ish brand color (not a low-opacity tint) so the card reads
        // correctly regardless of what page/background it sits on — the
        // light Settings list and the dark Profile hero alike.
        backgroundColor: hexToRgba(platform.brandColor, 92),
        borderRadius: "16px",
      };

  const compact = platform.id === "discord" && extraOn;
  const fullWidth = platform.id === "instagram" && extraOn;
  const showCaption = platform.id === "facebook" && extraOn;
  const showBanner = platform.id === "youtube" && extraOn;
  const stacked = cardTheme?.cardLayout === "stacked";
  const Tag = preview ? "div" : "a";
  const linkProps = preview
    ? {}
    : { href: url, target: "_blank", rel: "noreferrer" };

  return (
    <Tag
      {...linkProps}
      className={`relative flex overflow-hidden border border-white/10 shadow-sm transition-opacity hover:opacity-90 ${
        stacked
          ? "flex-col items-center text-center gap-2"
          : "items-center gap-3"
      } ${compact ? "p-2" : "p-4"} ${fullWidth ? "w-full" : ""}`}
      style={containerStyle}
    >
      {showBanner && (
        <div
          className="absolute inset-x-0 top-0 h-6 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, ${hexToRgba(platform.brandColor, 35)}, transparent)`,
          }}
        />
      )}
      <div
        className={`relative shrink-0 rounded-full flex items-center justify-center bg-white ${compact ? "h-8 w-8" : "h-10 w-10"}`}
      >
        <Icon
          className={compact ? "h-4 w-4" : "h-5 w-5"}
          color={platform.brandColor}
        />
      </div>
      <div className="relative min-w-0 flex-1">
        {showCaption && !showLabel && (
          <p className="text-xs font-bold text-white/90 leading-tight">
            {platform.label}
          </p>
        )}
        <p className="text-sm font-semibold text-white truncate">
          {showLabel ? platform.label : url || platform.urlPlaceholder}
        </p>
      </div>
    </Tag>
  );
}
