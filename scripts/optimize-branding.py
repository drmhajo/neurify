from pathlib import Path

from PIL import Image


def optimize_icon(source: Path, destinations: list[Path]) -> None:
    image = Image.open(source).convert("RGBA")
    image.thumbnail((512, 512), Image.Resampling.LANCZOS)
    indexed = image.convert("P", palette=Image.Palette.ADAPTIVE, colors=128)
    for destination in destinations:
        indexed.save(destination, format="PNG", optimize=True)


root = Path(__file__).resolve().parents[1]
assets = root / "assets" / "images"
optimize_icon(
    assets / "icon.png",
    [
        assets / "icon.png",
        assets / "splash-icon.png",
        assets / "favicon.png",
        assets / "android-icon-foreground.png",
    ],
)
