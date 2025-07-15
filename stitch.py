import sys
import cv2
import argparse

def main():
    parser = argparse.ArgumentParser(
        description="Stitch multiple images together automatically.",
        epilog="Example: python stitch.py -o stitched_image.png input1.png input2.png"
    )
    parser.add_argument(
        '-o', '--output',
        required=True,
        help="Path to save the resulting stitched image."
    )
    parser.add_argument(
        'images',
        nargs='+',
        help="Paths to the input images to stitch (at least two are required)."
    )

    args = parser.parse_args()

    if len(args.images) < 2:
        print("Error: At least two input images are required for stitching.", file=sys.stderr)
        sys.exit(1)

    try:
        # Read images
        images_data = []
        for filename in args.images:
            img = cv2.imread(filename)
            if img is None:
                print(f"Error: Cannot read image file: {filename}", file=sys.stderr)
                sys.exit(1)
            images_data.append(img)

        # Create a stitcher object
        stitcher = cv2.Stitcher_create()
        
        # Perform stitching
        status, stitched_image = stitcher.stitch(images_data)

        if status == cv2.Stitcher_OK:
            # Crop the black borders from the stitched image
            stitched_image = crop_black_borders(stitched_image)
            
            # Save the result
            cv2.imwrite(args.output, stitched_image)
            print(f"Stitched image saved to {args.output}")
        else:
            error_message = {
                cv2.Stitcher_ERR_NEED_MORE_IMGS: "Need more images to stitch. Check image quality and overlap.",
                cv2.Stitcher_ERR_HOMOGRAPHY_EST_FAIL: "Homography estimation failed. Ensure images have enough distinct features and overlap.",
                cv2.Stitcher_ERR_CAMERA_PARAMS_ADJUST_FAIL: "Camera parameter adjustment failed."
            }.get(status, f"An unknown stitching error occurred (Status code: {status})")
            print(f"Error: {error_message}", file=sys.stderr)
            sys.exit(1)

    except Exception as e:
        print(f"An unexpected error occurred: {e}", file=sys.stderr)
        sys.exit(1)

def crop_black_borders(image):
    """
    Crops the black borders from an image that are often left by stitching.
    """
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Threshold the image to create a mask of non-black pixels
    _, thresh = cv2.threshold(gray, 1, 255, cv2.THRESH_BINARY)
    
    # Find contours of the non-black regions
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        # If no contours are found, it means the image is all black.
        return image 

    # Find the bounding box of the largest contour
    # We assume the largest contour corresponds to the main stitched area
    largest_contour = max(contours, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(largest_contour)
    
    # Crop the image to this bounding box
    return image[y:y+h, x:x+w]


if __name__ == "__main__":
    main()
