from pathlib import Path

from PIL import Image


PROJECT = Path(__file__).resolve().parents[1]
ASSETS = PROJECT / "assets" / "images"
ICON_MASTER = Path("/home/ubuntu/webdev-static-assets/neurify-app-icon-light-safe-corrected.png")
SYMBOL_MASTER = Path("/home/ubuntu/webdev-static-assets/neurify-app-icon-master.png")
WORDMARK_MASTER = Path("/home/ubuntu/webdev-static-assets/neurify-wordmark-humanist.png")

NAVY = (8, 43, 73)
WHITE = (255, 255, 255)
LIGHT_BACKGROUND = (244, 248, 250)


def save_rgb(image: Image.Image, path: Path, size: int) -> None:
    image.convert("RGB").resize((size, size), Image.Resampling.LANCZOS).save(
        path, "PNG", optimize=True
    )


def save_splash(image: Image.Image, path: Path) -> None:
    resized = image.convert("RGB").resize((1500, 1500), Image.Resampling.LANCZOS)
    resized.quantize(colors=96, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(
        path, "PNG", optimize=True
    )


def alpha_mark(master: Image.Image) -> Image.Image:
    rgb = master.convert("RGB")
    rgba = rgb.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, _ = pixels[x, y]
            distance = abs(r - NAVY[0]) + abs(g - NAVY[1]) + abs(b - NAVY[2])
            alpha = 0 if distance < 36 else min(255, int((distance - 36) * 3.4))
            pixels[x, y] = (r, g, b, alpha)
    return rgba


def make_adaptive_foreground(icon: Image.Image) -> Image.Image:
    """Keep the full light icon and its generous safe area inside Android's mask."""
    return icon.convert("RGBA").resize((1080, 1080), Image.Resampling.LANCZOS)


def make_wordmark(wordmark: Image.Image) -> Image.Image:
    rgba = wordmark.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, _ = pixels[x, y]
            distance_from_white = abs(r - WHITE[0]) + abs(g - WHITE[1]) + abs(b - WHITE[2])
            pixels[x, y] = (r, g, b, 0 if distance_from_white < 30 else 255)
    content_box = rgba.getbbox()
    if content_box is None:
        raise RuntimeError("The approved Neurify wordmark did not contain visible artwork.")
    cropped = rgba.crop(content_box)
    padded = Image.new("RGBA", (cropped.width + 80, cropped.height + 48), (0, 0, 0, 0))
    padded.alpha_composite(cropped, (40, 24))
    padded.thumbnail((1024, 300), Image.Resampling.LANCZOS)
    return padded


def save_transparent_mark(master: Image.Image, path: Path) -> None:
    transparent_mark = alpha_mark(master).resize((1024, 1024), Image.Resampling.LANCZOS)
    transparent_mark.save(path, "PNG", optimize=True)


def main() -> None:
    if not ICON_MASTER.exists() or not SYMBOL_MASTER.exists() or not WORDMARK_MASTER.exists():
        raise FileNotFoundError("Missing approved Neurify brand source artwork.")

    ASSETS.mkdir(parents=True, exist_ok=True)
    master = Image.open(ICON_MASTER).convert("RGB")
    symbol_master = Image.open(SYMBOL_MASTER).convert("RGB")
    wordmark = Image.open(WORDMARK_MASTER).convert("RGB")

    # A light, opaque icon master with the full neural-path symbol inside its safe area.
    save_rgb(master, ASSETS / "icon.png", 1024)
    save_splash(master, ASSETS / "splash-icon.png")
    save_rgb(master, ASSETS / "favicon.png", 512)
    save_transparent_mark(symbol_master, ASSETS / "neurify-mark-transparent.png")
    make_wordmark(wordmark).save(ASSETS / "neurify-wordmark.png", "PNG", optimize=True)

    foreground = make_adaptive_foreground(master)
    foreground.save(ASSETS / "android-icon-foreground.png", "PNG", optimize=True)
    Image.new("RGB", (1080, 1080), LIGHT_BACKGROUND).save(
        ASSETS / "android-icon-background.png", "PNG", optimize=True
    )
    make_adaptive_foreground(alpha_mark(symbol_master)).save(
        ASSETS / "android-icon-monochrome.png", "PNG", optimize=True
    )

    print("Neurify app assets generated:")
    for name in (
        "icon.png",
        "splash-icon.png",
        "favicon.png",
        "neurify-mark-transparent.png",
        "neurify-wordmark.png",
        "android-icon-foreground.png",
        "android-icon-background.png",
        "android-icon-monochrome.png",
    ):
        image = Image.open(ASSETS / name)
        print(f"- {name}: {image.size[0]}x{image.size[1]} {image.mode}")


if __name__ == "__main__":
    main()
