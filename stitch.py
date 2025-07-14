import sys

import numpy as np
from PIL import Image


def find_vertical_overlap(arr1, arr2, min_overlap, threshold):
    """
    Finds the best vertical overlap with arr1 on top of arr2.
    """
    h1, w1, _ = arr1.shape
    h2, w2, _ = arr2.shape
    common_w = min(w1, w2)

    for overlap in range(min(h1, h2) - 1, min_overlap - 1, -1):
        slice1 = arr1[h1 - overlap:, :common_w, :]
        slice2 = arr2[:overlap, :common_w, :]
        diff = np.mean(np.abs(slice1.astype(float) - slice2.astype(float)))

        if diff < threshold:
            print(f"Found vertical overlap of {overlap} pixels with difference {diff:.2f}.")
            return overlap
    return 0


def find_horizontal_overlap(arr1, arr2, min_overlap, threshold):
    """
    Finds the best horizontal overlap with arr1 to the left of arr2.
    """
    h1, w1, _ = arr1.shape
    h2, w2, _ = arr2.shape
    common_h = min(h1, h2)

    for overlap in range(min(w1, w2) - 1, min_overlap - 1, -1):
        slice1 = arr1[:common_h, w1 - overlap:, :]
        slice2 = arr2[:common_h, :overlap, :]
        diff = np.mean(np.abs(slice1.astype(float) - slice2.astype(float)))

        if diff < threshold:
            print(f"Found horizontal overlap of {overlap} pixels with difference {diff:.2f}.")
            return overlap
    return 0


def stitch_images(img1_path, img2_path, output_path, direction, min_overlap=20, threshold=10.0):
    """
    Stitches two images together in a specified direction.
    """
    try:
        img1 = Image.open(img1_path).convert('RGB')
        img2 = Image.open(img2_path).convert('RGB')
    except FileNotFoundError as e:
        print(f"Error: {e}. Please check the image paths.")
        return

    arr1 = np.array(img1)
    arr2 = np.array(img2)

    if direction == 'vertical':
        overlap = find_vertical_overlap(arr1, arr2, min_overlap, threshold)
        if not overlap:
            print("Could not find a suitable vertical overlap.")
            return

        h1, w1, _ = arr1.shape
        h2, w2, _ = arr2.shape
        new_h = h1 + h2 - overlap
        new_w = max(w1, w2)
        new_arr = np.full((new_h, new_w, 3), 255, dtype=np.uint8)

        new_arr[:h1, :w1, :] = arr1
        new_arr[h1 - overlap:h1 - overlap + h2, :w2, :] = arr2

        new_img = Image.fromarray(new_arr)
        new_img.save(output_path)
        print(f"Successfully stitched images vertically. Saved to {output_path}")

    elif direction == 'horizontal':
        overlap = find_horizontal_overlap(arr1, arr2, min_overlap, threshold)
        if not overlap:
            print("Could not find a suitable horizontal overlap.")
            return

        h1, w1, _ = arr1.shape
        h2, w2, _ = arr2.shape
        new_w = w1 + w2 - overlap
        new_h = max(h1, h2)
        new_arr = np.full((new_h, new_w, 3), 255, dtype=np.uint8)

        new_arr[:h1, :w1, :] = arr1
        new_arr[:h2, w1 - overlap:w1 - overlap + w2, :] = arr2

        new_img = Image.fromarray(new_arr)
        new_img.save(output_path)
        print(f"Successfully stitched images horizontally. Saved to {output_path}")


if __name__ == "__main__":
    if len(sys.argv) != 5 or sys.argv[1] not in ['-v', '-h']:
        print("A tool to stitch two images with overlapping content.")
        print("Usage: python stitch.py <-v|-h> <image1_path> <image2_path> <output_path>")
        print("  -v: Vertical stitch (image1 on top of image2)")
        print("  -h: Horizontal stitch (image1 to the left of image2)")
        sys.exit(1)

    direction_flag = sys.argv[1]
    direction = 'vertical' if direction_flag == '-v' else 'horizontal'
    img1_path = sys.argv[2]
    img2_path = sys.argv[3]
    output_path = sys.argv[4]

    stitch_images(img1_path, img2_path, output_path, direction)
