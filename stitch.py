import sys

import numpy as np
from PIL import Image


def stitch_images(img1_path, img2_path, output_path, min_overlap=10):
    """
    Stitches two images together, automatically detecting overlap.
    """
    try:
        img1 = Image.open(img1_path).convert('RGB')
        img2 = Image.open(img2_path).convert('RGB')
    except FileNotFoundError as e:
        print(f"Error: {e}. Please check the image paths.")
        return

    arr1 = np.array(img1)
    arr2 = np.array(img2)

    h1, w1, _ = arr1.shape
    h2, w2, _ = arr2.shape

    # --- 1. Attempt Vertical Stitching with Similarity Matching ---
    print("Attempting vertical stitch using similarity matching...")
    common_w = min(w1, w2)
    best_v_diff = float('inf')
    best_v_overlap = -1

    for overlap in range(min(h1, h2) - 1, min_overlap, -1):
        slice1 = arr1[h1 - overlap:, :common_w, :]
        slice2 = arr2[:overlap, :common_w, :]

        # Use Mean Absolute Difference for similarity
        diff = np.mean(np.abs(slice1.astype(float) - slice2.astype(float)))

        if diff < best_v_diff:
            best_v_diff = diff
            best_v_overlap = overlap

    # Check if the best match is good enough (threshold is empirical)
    # Allows for an average difference of 2 (out of 255) per color channel
    V_THRESHOLD = 2.0
    if best_v_diff < V_THRESHOLD:
        print(
            f"Found best vertical match with difference {best_v_diff:.2f} at overlap {best_v_overlap} pixels.")

        new_w = max(w1, w2)
        new_h = h1 + h2 - best_v_overlap
        new_arr = np.full((new_h, new_w, 3), 255, dtype=np.uint8)

        new_arr[:h1, :w1, :] = arr1
        new_arr[h1:, :w2, :] = arr2[best_v_overlap:, :, :]

        new_img = Image.fromarray(new_arr)
        new_img.save(output_path)
        print(
            f"Successfully stitched images vertically. Saved to {output_path}")
        return
    else:
        print(
            f"Vertical stitch failed. Best match difference was {best_v_diff:.2f} (threshold: {V_THRESHOLD})")

    # --- 2. Attempt Horizontal Stitching with Similarity Matching ---
    print("Attempting horizontal stitch using similarity matching...")
    common_h = min(h1, h2)
    best_h_diff = float('inf')
    best_h_overlap = -1

    for overlap in range(min(w1, w2) - 1, min_overlap, -1):
        slice1 = arr1[:, w1 - overlap:, :][:common_h, :, :]
        slice2 = arr2[:, :overlap, :][:common_h, :, :]

        diff = np.mean(np.abs(slice1.astype(float) - slice2.astype(float)))

        if diff < best_h_diff:
            best_h_diff = diff
            best_h_overlap = overlap

    # Check if the best match is good enough
    H_THRESHOLD = 2.0
    if best_h_diff < H_THRESHOLD:
        print(
            f"Found best horizontal match with difference {best_h_diff:.2f} at overlap {best_h_overlap} pixels.")

        new_w = w1 + w2 - best_h_overlap
        new_h = max(h1, h2)
        new_arr = np.full((new_h, new_w, 3), 255, dtype=np.uint8)

        new_arr[:h1, :w1, :] = arr1
        new_arr[:h2, w1:, :] = arr2[:, best_h_overlap:, :]

        new_img = Image.fromarray(new_arr)
        new_img.save(output_path)
        print(
            f"Successfully stitched images horizontally. Saved to {output_path}")
        return
    else:
        print(
            f"Horizontal stitch failed. Best match difference was {best_h_diff:.2f} (threshold: {H_THRESHOLD})")

    print("Could not find a suitable overlap to stitch the images.")
    print("This tool requires a fairly clean overlap between the images.")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("A tool to stitch two images with overlapping content.")
        print("Usage: python stitch.py <image1_path> <image2_path> <output_path>")
        sys.exit(1)

    stitch_images(sys.argv[1], sys.argv[2], sys.argv[3])
