# Image Stitching Tool

A simple command-line tool to stitch two images together, either vertically or horizontally. The script automatically finds the overlapping region between the two images and merges them.

## Installation

Install the required Python libraries:

```bash
pip install -r requirements.txt
```

## Usage

The script requires you to specify the stitching direction (`-v` for vertical or `-h` for horizontal), followed by the two input image paths and the desired output path.

```bash
python stitch.py <-v|-h> <image1_path> <image2_path> <output_path>
```

### Arguments

- `-v`: Vertical stitch. Places the first image on top of the second.
- `-h`: Horizontal stitch. Places the first image to the left of the second.
- `image1_path`: Path to the first image.
- `image2_path`: Path to the second image.
- `output_path`: Path to save the resulting stitched image.

### Examples

**Vertical Stitch**

This will place `in-1.png` above `in-2.png`.

```bash
python stitch.py -v in-1.png in-2.png out.png
```

**Horizontal Stitch**

This will place `in-1.png` to the left of `in-2.png`.

```bash
python stitch.py -h in-1.png in-2.png out.png
```
