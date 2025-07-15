# Image Stitching Tool

A command-line tool to automatically stitch multiple images together using OpenCV. The script analyzes the images, finds matching features, and merges them into a single panoramic or composite image.

## Features

- **Automatic Stitching**: No need to specify the orientation (horizontal/vertical).
- **Multiple Images**: Stitch more than two images at once.
- **Black Border Cropping**: Automatically crops black borders that result from the stitching process.

## Installation

This project uses Python and requires OpenCV.

1. **Install Dependencies**:
    It's recommended to use a virtual environment. The dependencies are listed in `requirements.txt`.

    ```bash
    pip install -r requirements.txt
    ```

    > **Note for macOS (Apple Silicon) users**: If `pip` fails to install `opencv-python`, it is often more reliable to install it using Conda from the `conda-forge` channel:
    > `conda install -c conda-forge opencv`

## Usage

The script requires you to specify an output file with `-o` and provide at least two input images.

```bash
python stitch.py -o <output_path> <image1_path> <image2_path> ...
```

### Arguments

- `-o, --output`: Path to save the resulting stitched image. (Required)
- `images`: One or more paths to the input images to be stitched.

### Example

This command will stitch `in-1.png` and `in-2.png` together and save the result as `out.png`.

```bash
python stitch.py -o out.png in-1.png in-2.png
```

You can also provide more than two images:

```bash
python stitch.py -o panorama.jpg image1.png image2.png image3.png image4.png
```
