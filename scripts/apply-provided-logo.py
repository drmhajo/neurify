from pathlib import Path
from PIL import Image

source = Path('/home/ubuntu/upload/NSKSMC20260826_042357.jpg')
target_dir = Path('/home/ubuntu/ksmc-neurosurgery/assets/images')

with Image.open(source) as image:
    canvas = image.convert('RGBA')
    for name, size in {
        'icon.png': 1024,
        'splash-icon.png': 1024,
        'android-icon-foreground.png': 1024,
        'favicon.png': 256,
    }.items():
        rendered = canvas.resize((size, size), Image.Resampling.LANCZOS)
        rendered.save(target_dir / name, 'PNG', optimize=True)
