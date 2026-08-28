from pathlib import Path

from PIL import Image


PROJECT = Path(__file__).resolve().parents[1]
ASSETS = PROJECT / "assets" / "images"
ICON_MASTER = Path("/home/ubuntu/webdev-static-assets/neurify-app-icon-master.png")
WORDMARK_MASTER = Path("/home/ubuntu/webdev-static-assets/neurify-wordmark-humanist.png")

NAVY = (8, 43, 73)
WHITE = (255, 255, 255)


def save_rgb(image: Image.Image, path: Path, size: int) -> None:
    image.convert("RGB").resize((size, size), Image.Resampling.LANCZOS).save(
        path, "PNG", optimize=True
    )


def save_splash(image: Image.Image, path: Path) -> None:
    resized = image.convert("RGB").resize((1500, 1500), Image.Resampling.LANCZOS)
    resized.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(
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


def make_adaptive_foreground(mark: Image.Image, monochrome: bool = False) -> Image.Image:
    content_box = mark.getbbox()
    if content_box is None:
        raise RuntimeError("The Neurify mark did not contain a visible foreground.")
    cropped = mark.crop(content_box)
    cropped.thumbnail((720, 720), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (1080, 1080), (0, 0, 0, 0))
    x = (1080 - cropped.width) // 2
    y = (1080 - cropped.height) // 2
    canvas.alpha_composite(cropped, (x, y))
    if monochrome:
        alpha = canvas.getchannel("A")
        canvas = Image.new("RGBA", canvas.size, (*WHITE, 0))
        canvas.putalpha(alpha)
    return canvas


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


def main() -> None:
    if not ICON_MASTER.exists() or not WORDMARK_MASTER.exists():
        raise FileNotFoundError("Missing approved Neurify brand source artwork.")

    ASSETS.mkdir(parents=True, exist_ok=True)
    master = Image.open(ICON_MASTER).convert("RGB")
    wordmark = Image.open(WORDMARK_MASTER).convert("RGB")

    # Full-bleed, opaque source artwork for iOS launcher, web, and splash.
    save_rgb(master, ASSETS / "icon.png", 1024)
    save_splash(master, ASSETS / "splash-icon.png")
    save_rgb(master, ASSETS / "favicon.png", 512)
    make_wordmark(wordmark).save(ASSETS / "neurify-wordmark.png", "PNG", optimize=True)

    foreground = make_adaptive_foreground(alpha_mark(master))
    foreground.save(ASSETS / "android-icon-foreground.png", "PNG", optimize=True)
    Image.new("RGB", (1080, 1080), NAVY).save(
        ASSETS / "android-icon-background.png", "PNG", optimize=True
    )
    make_adaptive_foreground(alpha_mark(master), monochrome=True).save(
        ASSETS / "android-icon-monochrome.png", "PNG", optimize=True
    )

    print("Neurify app assets generated:")
    for name in (
        "icon.png",
        "splash-icon.png",
        "favicon.png",
        "neurify-wordmark.png",
        "android-icon-foreground.png",
        "android-icon-background.png",
        "android-icon-monochrome.png",
    ):
        image = Image.open(ASSETS / name)
        print(f"- {name}: {image.size[0]}x{image.size[1]} {image.mode}")


if __name__ == "__main__":
    main()
