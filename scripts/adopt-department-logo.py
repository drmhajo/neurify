from pathlib import Path
from PIL import Image

source = Path("/home/ubuntu/upload/1000104022.jpg")
target_dir = Path("/home/ubuntu/ksmc-neurosurgery/assets/images")
target_dir.mkdir(parents=True, exist_ok=True)

with Image.open(source) as image:
    logo = image.convert("RGB").resize((1024, 1024), Image.Resampling.LANCZOS)
    for name in ("icon.png", "splash-icon.png", "favicon.png", "android-icon-foreground.png"):
        logo.save(target_dir / name, "PNG", optimize=True)
