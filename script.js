document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('image-input');
    const directionSelect = document.getElementById('direction');
    const stitchBtn = document.getElementById('stitch-btn');
    const resultImg = document.getElementById('result-img');
    const downloadLink = document.getElementById('download-link');
    const placeholder = document.getElementById('placeholder');
    const previewArea = document.getElementById('preview-area');

    let imageItems = []; // Will hold objects like { id, file }
    let nextId = 0;
    let draggedItem = null;

    const MIN_OVERLAP = 20;
    const THRESHOLD = 10.0;

    // --- Image Loading and Processing ---
    const loadImage = (file) => {
        return new Promise((resolve, reject) => {
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

    // --- UI Rendering ---
    const renderPreviews = () => {
        previewArea.innerHTML = '';
        imageItems.forEach((itemData) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const item = document.createElement('div');
                item.className = 'preview-item';
                item.dataset.id = itemData.id; // Use stable unique ID
                item.draggable = true;

                const img = document.createElement('img');
                img.className = 'preview-img';
                img.src = e.target.result;

                const delBtn = document.createElement('button');
                delBtn.className = 'delete-btn';
                delBtn.innerHTML = '&times;';
                delBtn.addEventListener('click', () => deleteImage(itemData.id));

                item.appendChild(img);
                item.appendChild(delBtn);
                previewArea.appendChild(item);
            };
            reader.readAsDataURL(itemData.file);
        });
    };

    // --- Event Handlers ---
    imageInput.addEventListener('change', (e) => {
        const newFiles = [...e.target.files];
        const uniqueNewFiles = newFiles.filter(newFile => {
            const isDuplicate = imageItems.some(item => 
                item.file.name === newFile.name && item.file.size === newFile.size
            );
            if (isDuplicate) {
                console.log(`Duplicate file ignored: ${newFile.name}`);
            }
            return !isDuplicate;
        });

        uniqueNewFiles.forEach(file => {
            imageItems.push({ id: nextId++, file: file });
        });
        
        renderPreviews();
        imageInput.value = '';
    });

    const deleteImage = (id) => {
        imageItems = imageItems.filter(item => item.id !== id);
        renderPreviews();
    };

    // --- Drag and Drop ---
    previewArea.addEventListener('dragstart', (e) => {
        draggedItem = e.target.closest('.preview-item');
        setTimeout(() => {
            if (draggedItem) draggedItem.classList.add('dragging');
        }, 0);
    });

    previewArea.addEventListener('dragend', () => {
        if (draggedItem) draggedItem.classList.remove('dragging');
        draggedItem = null;
    });

    previewArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(previewArea, e.clientX, e.clientY);
        const currentDragged = document.querySelector('.dragging');
        if (!currentDragged) return;
        
        if (afterElement == null) {
            previewArea.appendChild(currentDragged);
        } else {
            previewArea.insertBefore(currentDragged, afterElement);
        }
    });
    
    previewArea.addEventListener('drop', (e) => {
        e.preventDefault();
        if (!draggedItem) return;

        const newDomOrder = [...previewArea.querySelectorAll('.preview-item')];
        imageItems = newDomOrder.map(item => {
            const id = parseInt(item.dataset.id);
            return imageItems.find(imgItem => imgItem.id === id);
        });
        
        renderPreviews();
    });

    function getDragAfterElement(container, x, y) {
        const draggableElements = [...container.querySelectorAll('.preview-item:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offsetX = x - box.left - box.width / 2;
            const offsetY = y - box.top - box.height / 2;
            // Using squared distance to avoid Math.sqrt
            const distance = offsetX * offsetX + offsetY * offsetY;

            if (distance < closest.distance) {
                return { distance: distance, element: child };
            } else {
                return closest;
            }
        }, { distance: Number.POSITIVE_INFINITY }).element;
    }

    // --- Stitching Logic ---
    const getPixelDiff = (data1, data2, x1, y1, x2, y2, width, height) => {
        let diff = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const p1 = ((y1 + y) * data1.width + (x1 + x)) * 4;
                const p2 = ((y2 + y) * data2.width + (x2 + x)) * 4;
                diff += Math.abs(data1.data[p1] - data2.data[p2]);
                diff += Math.abs(data1.data[p1 + 1] - data2.data[p2 + 1]);
                diff += Math.abs(data1.data[p1 + 2] - data2.data[p2 + 2]);
            }
        }
        return diff / (width * height * 3);
    };

    const findOverlap = (data1, data2, direction) => {
        if (direction === 'horizontal') {
            const commonH = Math.min(data1.height, data2.height);
            for (let overlap = Math.min(data1.width, data2.width) - 1; overlap >= MIN_OVERLAP; overlap--) {
                const diff = getPixelDiff(data1, data2, data1.width - overlap, 0, 0, 0, overlap, commonH);
                if (diff < THRESHOLD) return overlap;
            }
        } else { // vertical
            const commonW = Math.min(data1.width, data2.width);
            for (let overlap = Math.min(data1.height, data2.height) - 1; overlap >= MIN_OVERLAP; overlap--) {
                const diff = getPixelDiff(data1, data2, 0, data1.height - overlap, 0, 0, commonW, overlap);
                if (diff < THRESHOLD) return overlap;
            }
        }
        return 0;
    };

    const stitchTwoImages = async (img1, img2, direction) => {
        const data1 = getImageData(img1);
        const data2 = getImageData(img2);
        const overlap = findOverlap(data1, data2, direction);

        if (!overlap) {
            console.warn("Could not find overlap between two images. Stitching without overlap.");
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (direction === 'horizontal') {
            canvas.width = img1.width + img2.width - overlap;
            canvas.height = Math.max(img1.height, img2.height);
            ctx.drawImage(img1, 0, 0);
            ctx.drawImage(img2, img1.width - overlap, 0);
        } else {
            canvas.width = Math.max(img1.width, img2.width);
            canvas.height = img1.height + img2.height - overlap;
            ctx.drawImage(img1, 0, 0);
            ctx.drawImage(img2, 0, img1.height - overlap);
        }
        
        return loadImage(await new Promise(res => canvas.toBlob(res, 'image/png')));
    };

    stitchBtn.addEventListener('click', async () => {
        if (imageItems.length < 2) {
            alert('Please select at least two images.');
            return;
        }

        try {
            stitchBtn.textContent = 'Stitching...';
            stitchBtn.disabled = true;

            const loadedImages = await Promise.all(imageItems.map(item => loadImage(item.file)));
            const direction = directionSelect.value;
            
            let stitchedImage = loadedImages[0];
            for (let i = 1; i < loadedImages.length; i++) {
                stitchedImage = await stitchTwoImages(stitchedImage, loadedImages[i], direction);
            }

            const dataUrl = stitchedImage.src;
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
