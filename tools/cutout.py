"""Cut Maya out of a photo, add a white sticker border, and export a small WebP for the site.

Runs fully on this computer (rembg + local models in ~/.rembg/models); photos never leave it.
Usage: python -I tools/cutout.py <source.jpg> <out.webp> [height=720] [border_px=10]
Output has no EXIF/GPS metadata.
"""
import sys

import numpy as np
from PIL import Image, ImageFilter, ImageOps
from rembg import new_session, remove

src, out = sys.argv[1], sys.argv[2]
target_h = int(sys.argv[3]) if len(sys.argv) > 3 else 720
border = int(sys.argv[4]) if len(sys.argv) > 4 else 10

img = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
# work at a sane size for CPU inference
scale = 1600 / max(img.size)
if scale < 1:
    img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)

session = new_session("birefnet-portrait")
try:
    cut = remove(img, session=session, vitmatte=True)
except TypeError:
    cut = remove(img, session=session)
cut = cut.convert("RGBA")

# keep only the largest connected shape of the mask (drops stray background bits)
alpha = np.array(cut.split()[-1])
mask = alpha > 40
try:
    from scipy import ndimage  # optional

    labels, n = ndimage.label(mask)
    if n > 1:
        sizes = ndimage.sum(mask, labels, range(1, n + 1))
        keep = labels == (int(np.argmax(sizes)) + 1)
        alpha = np.where(keep, alpha, 0).astype(np.uint8)
        cut.putalpha(Image.fromarray(alpha))
except ImportError:
    pass

# crop to the subject + margin
ys, xs = np.nonzero(alpha > 20)
pad = int(0.04 * max(cut.size)) + border * 2
x0, x1 = max(0, xs.min() - pad), min(cut.width, xs.max() + pad)
y0, y1 = max(0, ys.min() - pad), min(cut.height, ys.max() + pad)
cut = cut.crop((x0, y0, x1, y1))

# resize to target height
ratio = target_h / cut.height
cut = cut.resize((max(1, round(cut.width * ratio)), target_h), Image.LANCZOS)

# white die-cut sticker border: grow the alpha and put white underneath
a = cut.split()[-1]
grown = a.filter(ImageFilter.MaxFilter(border * 2 + 1)).filter(ImageFilter.GaussianBlur(1.2))
sticker = Image.new("RGBA", cut.size, (255, 253, 248, 0))
sticker.putalpha(grown)
white = Image.new("RGBA", cut.size, (255, 253, 248, 255))
white.putalpha(grown)
base = Image.alpha_composite(Image.new("RGBA", cut.size, (0, 0, 0, 0)), white)
final = Image.alpha_composite(base, cut)
final.save(out, "WEBP", quality=82, alpha_quality=90, method=6)  # Pillow writes no EXIF unless given
print(out, final.size)
