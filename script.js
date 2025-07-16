// TODO: Create a custom build of OpenCV.js to reduce the file size.
// The current full build is ~8MB, which is not suitable for production.
// A custom build should only include the necessary modules:
// 'core', 'imgproc', 'features2d', 'calib3d', and 'stitching'.
// This can be done using the build scripts in the official OpenCV repository.

const imageInput = document.getElementById('image-input');
const stitchBtn = document.getElementById('stitch-btn');
const statusEl = document.getElementById('status');
const previewArea = document.getElementById('preview-area');
const resultCanvas = document.getElementById('result-canvas');
const downloadLink = document.getElementById('download-link');

let imageFiles = []; // Will hold the File objects

// This function is called by the `onload` attribute in the <script> tag
function onOpenCvReady() {
  statusEl.textContent = 'OpenCV loaded. Ready to stitch!';
  stitchBtn.textContent = 'Stitch Images';
  stitchBtn.disabled = false;
}

function onOpenCvError() {
  statusEl.innerHTML = '<strong>Failed to load OpenCV.js.</strong> Please check your internet connection and try refreshing the page.';
}

// --- UI and File Handling ---

imageInput.addEventListener('change', (e) => {
  imageFiles = Array.from(e.target.files);
  renderPreviews();
});

function renderPreviews() {
  previewArea.innerHTML = '';
  if (imageFiles.length === 0) {
    previewArea.innerHTML = '<p>No images selected.</p>';
    return;
  }
  imageFiles.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const item = document.createElement('div');
      item.className = 'preview-item';
      const img = document.createElement('img');
      img.className = 'preview-img';
      img.src = e.target.result;
      item.appendChild(img);
      previewArea.appendChild(item);
    };
    reader.readAsDataURL(file);
  });
}

// --- Image Stitching Logic ---

stitchBtn.addEventListener('click', async () => {
  if (imageFiles.length < 2) {
    alert('Please select at least two images.');
    return;
  }

  if (typeof cv === 'undefined') {
    onOpenCvError();
    return;
  }

  // Disable button and show status
  stitchBtn.disabled = true;
  downloadLink.style.display = 'none';
  statusEl.textContent = 'Reading images...';

  // Use a try...finally block to ensure resources are cleaned up
  let mats = [];
  let stitcher = null;
  let pano = new cv.Mat();
  
  try {
    // 1. Read files and convert them to cv.Mat objects
    const imagePromises = imageFiles.map(file => loadImageToMat(file));
    mats = await Promise.all(imagePromises);
    
    statusEl.textContent = `Successfully loaded ${mats.length} images. Starting stitch...`;

    // 2. Create a vector of Mats for the stitcher
    let imageVec = new cv.MatVector();
    mats.forEach(mat => imageVec.push_back(mat));

    // 3. Stitch the images
    stitcher = new cv.Stitcher();
    let status = stitcher.stitch(imageVec, pano);

    // Check for errors
    if (status !== cv.Stitcher.OK) {
      throw new Error(`Stitching failed. OpenCV error code: ${getOpenCvStitcherStatus(status)}`);
    }

    // 4. Display the result
    statusEl.textContent = 'Stitching successful! Displaying result.';
    cv.imshow(resultCanvas, pano);
    
    // 5. Show download link
    downloadLink.href = resultCanvas.toDataURL('image/png');
    downloadLink.download = 'stitched-image-opencv.png';
    downloadLink.style.display = 'inline-block';

  } catch (error) {
    console.error(error);
    statusEl.textContent = `Error: ${error.message}`;
  } finally {
    // 6. IMPORTANT: Clean up memory
    mats.forEach(mat => mat.delete());
    if (stitcher) stitcher.delete();
    pano.delete();
    
    // Re-enable button
    stitchBtn.disabled = false;
    stitchBtn.textContent = 'Stitch Images';
  }
});

// Helper function to load a file into a cv.Mat
function loadImageToMat(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const mat = cv.imread(img);
          resolve(mat);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = (err) => {
        reject(new Error(`Failed to load image: ${file.name}`));
      };
      img.src = event.target.result;
    };
    reader.onerror = (err) => {
      reject(new Error(`Failed to read file: ${file.name}`));
    };
    reader.readAsDataURL(file);
  });
}

// Helper to get human-readable status
function getOpenCvStitcherStatus(status) {
    const statuses = {
        [cv.Stitcher.OK]: 'OK',
        [cv.Stitcher.ERR_NEED_MORE_IMGS]: 'ERR_NEED_MORE_IMGS',
        [cv.Stitcher.ERR_HOMOGRAPHY_EST_FAIL]: 'ERR_HOMOGRAPHY_EST_FAIL',
        [cv.Stitcher.ERR_CAMERA_PARAMS_ADJUST_FAIL]: 'ERR_CAMERA_PARAMS_ADJUST_FAIL',
    };
    return statuses[status] || 'UNKNOWN_ERROR';
}