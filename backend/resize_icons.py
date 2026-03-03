import os
from PIL import Image

def resize_icon():
    source = r"c:\Users\mhrizvi28\Documents\routeeasy\frontend\public\logo2.png"
    out_dir = r"c:\Users\mhrizvi28\Documents\routeeasy\frontend\public\icons"
    
    os.makedirs(out_dir, exist_ok=True)
    
    with Image.open(source) as img:
        # PWA icons
        img_192 = img.resize((192, 192), Image.Resampling.LANCZOS)
        img_192.save(os.path.join(out_dir, "icon-192x192.png"))
        
        img_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
        img_512.save(os.path.join(out_dir, "icon-512x512.png"))
        
        # Apple touch icon
        img_180 = img.resize((180, 180), Image.Resampling.LANCZOS)
        img_180.save(os.path.join(out_dir, "apple-touch-icon.png"))
        
    print("Icons successfully generated!")

if __name__ == "__main__":
    resize_icon()
