document.addEventListener('DOMContentLoaded', () => {
    const image1Input = document.getElementById('image1');
    const image2Input = document.getElementById('image2');
    const directionSelect = document.getElementById('direction');
    const stitchBtn = document.getElementById('stitch-btn');
    const resultImg = document.getElementById('result-img');
    const downloadLink = document.getElementById('download-link');
    const placeholder = document.getElementById('placeholder');

    const MIN_OVERLAP = 20;
    const THRESHOLD = 10.0;

    const loadImage = (file) => {
        return new Promise((resolve, reject) => {
            if (!file) {
                return reject(new Error('No file selected.'));
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const getImageData = (img) => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, img.width, img.height);
    };

    const getPixelDiff = (data1, data2, x1, y1, x2, y2, width, height) => {
        let diff = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const p1 = ((y1 + y) * data1.width + (x1 + x)) * 4;
                const p2 = ((y2 + y) * data2.width + (x2 + x)) * 4;
                diff += Math.abs(data1.data[p1] - data2.data[p2]);     // R
                diff += Math.abs(data1.data[p1 + 1] - data2.data[p2 + 1]); // G
                diff += Math.abs(data1.data[p1 + 2] - data2.data[p2 + 2]); // B
            }
        }
        return diff / (width * height * 3);
    };

    const findHorizontalOverlap = (data1, data2) => {
        const commonH = Math.min(data1.height, data2.height);
        for (let overlap = Math.min(data1.width, data2.width) - 1; overlap >= MIN_OVERLAP; overlap--) {
            const diff = getPixelDiff(data1, data2, data1.width - overlap, 0, 0, 0, overlap, commonH);
            if (diff < THRESHOLD) {
                console.log(`Found horizontal overlap of ${overlap} pixels with difference ${diff.toFixed(2)}.`);
                return overlap;
            }
        }
        return 0;
    };

    const findVerticalOverlap = (data1, data2) => {
        const commonW = Math.min(data1.width, data2.width);
        for (let overlap = Math.min(data1.height, data2.height) - 1; overlap >= MIN_OVERLAP; overlap--) {
            const diff = getPixelDiff(data1, data2, 0, data1.height - overlap, 0, 0, commonW, overlap);
            if (diff < THRESHOLD) {
                console.log(`Found vertical overlap of ${overlap} pixels with difference ${diff.toFixed(2)}.`);
                return overlap;
            }
        }
        return 0;
    };


    stitchBtn.addEventListener('click', async () => {
        if (!image1Input.files[0] || !image2Input.files[0]) {
            alert('Please select two images.');
            return;
        }

        try {
            stitchBtn.textContent = 'Stitching...';
            stitchBtn.disabled = true;

            const img1 = await loadImage(image1Input.files[0]);
            const img2 = await loadImage(image2Input.files[0]);
            
            const data1 = getImageData(img1);
            const data2 = getImageData(img2);

            const direction = directionSelect.value;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (direction === 'horizontal') {
                const overlap = findHorizontalOverlap(data1, data2);
                if (!overlap) {
                    alert("Could not find a suitable horizontal overlap.");
                    return;
                }
                canvas.width = img1.width + img2.width - overlap;
                canvas.height = Math.max(img1.height, img2.height);
                ctx.drawImage(img1, 0, 0);
                ctx.drawImage(img2, img1.width - overlap, 0);

            } else { // vertical
                const overlap = findVerticalOverlap(data1, data2);
                 if (!overlap) {
                    alert("Could not find a suitable vertical overlap.");
                    return;
                }
                canvas.width = Math.max(img1.width, img2.width);
                canvas.height = img1.height + img2.height - overlap;
                ctx.drawImage(img1, 0, 0);
                ctx.drawImage(img2, 0, img1.height - overlap);
            }

            const dataUrl = canvas.toDataURL('image/png');
            resultImg.src = dataUrl;
            resultImg.style.display = 'block';
            placeholder.style.display = 'none';
            
            downloadLink.href = dataUrl;
            downloadLink.download = 'stitched-image.png';
            downloadLink.style.display = 'inline-block';

        } catch (error) {
            console.error('Error stitching images:', error);
            alert('An error occurred while stitching the images. Please check the console.');
        } finally {
            stitchBtn.textContent = 'Stitch Images';
            stitchBtn.disabled = false;
        }
    });
});
