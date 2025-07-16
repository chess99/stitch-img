# How to Build a Custom, Lightweight opencv.js

The default `opencv.js` file from CDNs is large (~8-10 MB) and does not include the `stitching` module. To use the image stitcher functionality on a static website, you must build a custom version from the source code.

This guide provides the steps to build a minimal `opencv.js` that only includes the necessary modules for image stitching. This will significantly reduce the file size and make it suitable for web use.

## Prerequisites

1.  **Git**: To clone the OpenCV repositories.
2.  **Python**: To run the build scripts.
3.  **Emscripten SDK**: The toolchain for compiling C++ to WebAssembly.

## Step 1: Set up Emscripten

Emscripten is the compiler we'll use. If you don't have it, follow these steps.

```bash
# 1. Clone the Emscripten SDK repository
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk

# 2. Download and install the latest SDK tools
./emsdk install latest

# 3. Activate the latest SDK
./emsdk activate latest

# 4. IMPORTANT: Set up the environment variables for your current terminal session.
# You will need to run this command every time you open a new terminal to build.
source ./emsdk_env.sh
```
**Note:** Remember the path to the `emsdk` directory. You will need it later.

## Step 2: Clone OpenCV Repositories

The `stitching` module is in the `opencv_contrib` repository, so you need to clone both the main and the contrib repos.

```bash
# Go to your main development directory (outside the emsdk folder)
mkdir opencv-build-area
cd opencv-build-area

# 1. Clone the main OpenCV repository
git clone https://github.com/opencv/opencv.git

# 2. Clone the contrib repository
git clone https://github.com/opencv/opencv_contrib.git
```

## Step 3: Build opencv.js

This is the final step where we run the build script.

1.  Navigate to the `opencv` directory you just cloned.
2.  Run the Python build script with the correct parameters.

The key is the `--build_doc` parameter, which allows us to specify exactly which modules to include. For stitching, we need `core`, `features2d`, `calib3d`, and `stitching`. The script automatically handles dependencies.

```bash
# Navigate into the main opencv repo directory
cd opencv

# Run the build script
# Make sure you have activated emsdk_env.sh in your terminal (from Step 1)
python ./platforms/js/build_js.py build_wasm \
    --build_contrib \
    --cmake_option="-DOPENCV_EXTRA_MODULES_PATH=../../opencv_contrib/modules" \
    --build_doc stitching
```

## Step 4: Get the Result

-   After the build process completes (it might take a while), you will find the generated files in the `build_wasm` directory inside the `opencv` folder.
-   The file you need is `build_wasm/bin/opencv.js`.
-   Copy this `opencv.js` file to the root of your `stitch-img` project directory.

Now your project will use this custom, lightweight version that includes the `Stitcher` class.
