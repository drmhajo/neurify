from pathlib import Path
from PIL import Image


ROOT = Path("/home/ubuntu/ksmc-neurosurgery")
SOURCE = ROOT / "brand-assets" / "neurify" / "neurify-app-icon-master.png"
OUTPUT = ROOT / "brand-assets" / "neurify" / "store-icons"

IOS_SIZES = {
    "AppIcon-20@1x.png": 20,
    "AppIcon-20@2x.png": 40,
    "AppIcon-20@3x.png": 60,
    "AppIcon-29@1x.png": 29,
    "AppIcon-29@2x.png": 58,
    "AppIcon-29@3x.png": 87,
    "AppIcon-40@1x.png": 40,
    "AppIcon-40@2x.png": 80,
    "AppIcon-40@3x.png": 120,
    "AppIcon-60@2x.png": 120,
    "AppIcon-60@3x.png": 180,
    "AppIcon-76@1x.png": 76,
    "AppIcon-76@2x.png": 152,
    "AppIcon-83.5@2x.png": 167,
    "AppStore-1024.png": 1024,
}

ANDROID_SIZES = {
    "mipmap-mdpi/ic_launcher.png": 48,
    "mipmap-hdpi/ic_launcher.png": 72,
    "mipmap-xhdpi/ic_launcher.png": 96,
    "mipmap-xxhdpi/ic_launcher.png": 144,
    "mipmap-xxxhdpi/ic_launcher.png": 192,
    "adaptive-icon-foreground-432.png": 432,
    "GooglePlay-512.png": 512,
}


def export_icon(source: Image.Image, relative_path: str, size: int) -> None:
    destination = OUTPUT / relative_path
    destination.parent.mkdir(parents=True, exist_ok=True)
    icon = source.resize((size, size), Image.Resampling.LANCZOS)
    if icon.mode != "RGB":
        icon = icon.convert("RGB")
    icon.save(destination, "PNG", optimize=True)


def export_adaptive_background(size: int) -> None:
    destination = OUTPUT / "android" / f"adaptive-icon-background-{size}.png"
    destination.parent.mkdir(parents=True, exist_ok=True)
    Image.new("RGB", (size, size), "#082B49").save(destination, "PNG", optimize=True)


def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(f"Missing source icon: {SOURCE}")

    master = Image.open(SOURCE).convert("RGB")
    if master.width != master.height:
        raise ValueError("The Neurify master icon must be square.")

    for filename, size in IOS_SIZES.items():
        export_icon(master, f"ios/{filename}", size)
    for filename, size in ANDROID_SIZES.items():
        export_icon(master, f"android/{filename}", size)
    export_adaptive_background(432)

    (OUTPUT / "README.md").write_text(
        "# Neurify Store Icon Assets\n\n"
        "This directory contains RGB PNG exports from the approved Neurify icon master. "
        "Use `ios/AppStore-1024.png` for App Store Connect and `android/GooglePlay-512.png` for Google Play. "
        "The Android `mipmap-*` assets are legacy launcher-density variants. The included 432px adaptive background is navy; "
        "pair it with the separate transparent Neurify adaptive foreground master after review when producing native adaptive icon layers.\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
