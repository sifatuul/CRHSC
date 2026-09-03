// --- CONFIGURATION ---
const USERNAME = 'sifatuul'; 
const REPO = 'CRHSC';           
const BRANCH = 'main';                   
const CHAPTER_PASSWORD = 'CRHSC2026'; 

// --- DOM ELEMENTS ---
const chapterList = document.getElementById('chapter-list');
const chapterTitle = document.getElementById('chapter-title');
const assetsContainer = document.getElementById('assets-container');
const documentList = document.getElementById('document-list');
const imageGallery = document.getElementById('image-gallery');

// Base API URL
const apiUrl = `https://api.github.com/repos/${USERNAME}/${REPO}/contents`;

// --- 24-HOUR PASSWORD LOGIC ---
function isAuthenticated() {
    const lastAuthStr = localStorage.getItem('crhsc_auth_time');
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000; // milliseconds in 24 hours

    // If logged in within the last 24 hours, allow access
    if (lastAuthStr && (now - parseInt(lastAuthStr)) < twentyFourHours) {
        return true; 
    }

    // Otherwise, ask for password
    const userInput = prompt("এই অধ্যায়টি দেখতে পাসওয়ার্ড দিন:");
    if (userInput === CHAPTER_PASSWORD) {
        // Save the current timestamp to LocalStorage
        localStorage.setItem('crhsc_auth_time', now.toString());
        return true;
    } else {
        alert("ভুল পাসওয়ার্ড! অ্যাক্সেস ডিনাইড।");
        return false;
    }
}

// 1. FETCH ALL CHAPTER FOLDERS ON LOAD
async function fetchChapters() {
    chapterList.innerHTML = '<li>অধ্যায় লোড হচ্ছে...</li>';
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Failed to fetch repo contents.');
        
        const contents = await response.json();
        chapterList.innerHTML = ''; 

        const chapters = contents.filter(item => 
            item.type === 'dir' && 
            !['css', 'js', 'assets', '.github'].includes(item.name.toLowerCase())
        );

        chapters.forEach(chapter => {
            const li = document.createElement('li');
            li.textContent = chapter.name;
            li.onclick = () => loadChapterContents(chapter.name, chapter.path, li);
            chapterList.appendChild(li);
        });

    } catch (error) {
        console.error(error);
        chapterList.innerHTML = '<li style="color:#d32f2f;">অধ্যায় লোড করতে ত্রুটি হয়েছে।</li>';
    }
}

// 2. LOAD FILES & DYNAMIC IMAGE FOLDERS FOR A SPECIFIC CHAPTER
async function loadChapterContents(chapterName, chapterPath, listElement) {
    // Check password before proceeding
    if (!isAuthenticated()) return;

    // UI Updates
    document.querySelectorAll('.sidebar li').forEach(el => el.classList.remove('active'));
    listElement.classList.add('active');
    chapterTitle.textContent = chapterName;
    assetsContainer.style.display = 'block';
    
    documentList.innerHTML = '<li>ফাইল স্ক্যান করা হচ্ছে...</li>';
    imageGallery.innerHTML = '<p>ছবির ফোল্ডার স্ক্যান করা হচ্ছে...</p>';

    try {
        const chapterResponse = await fetch(`${apiUrl}/${encodeURIComponent(chapterPath)}`);
        const chapterContents = await chapterResponse.json();

        const docs = [];
        const subDirs = []; 

        // Separate files and subdirectories (Show ALL files now)
        chapterContents.forEach(item => {
            if (item.type === 'file') {
                docs.push(item);
            } else if (item.type === 'dir') {
                subDirs.push(item);
            }
        });

        // Render Documents in Grid Layout with Icons
        documentList.innerHTML = '';
        if (docs.length === 0) {
            documentList.innerHTML = '<li style="grid-column: 1 / -1;">এই ফোল্ডারে কোনো ডকুমেন্ট পাওয়া যায়নি।</li>';
        } else {
            docs.forEach(doc => {
                const li = document.createElement('li');
                const downloadUrl = `https://raw.githubusercontent.com/${USERNAME}/${REPO}/${BRANCH}/${doc.path}`;
                const lowerName = doc.name.toLowerCase();
                
                // Determine Icon and Styling based on file extension
                let iconClass = "fa-solid fa-file icon-default";
                let cardStyle = "doc-card";

                if (lowerName.endsWith('.pdf')) {
                    iconClass = "fa-solid fa-file-pdf icon-pdf";
                } else if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) {
                    iconClass = "fa-solid fa-file-word icon-word";
                } else if (lowerName.endsWith('.ai')) {
                    iconClass = "fa-solid fa-pen-nib icon-ai"; 
                } else if (lowerName.endsWith('.zip') || lowerName.endsWith('.rar')) {
                    iconClass = "fa-solid fa-file-zipper";
                    cardStyle = "doc-card master-file"; // Apply exclusive zip styling
                }

                li.innerHTML = `
                    <a href="${downloadUrl}" target="_blank" download class="${cardStyle}">
                        <i class="${iconClass}"></i>
                        <span>${doc.name}</span>
                    </a>
                `;
                documentList.appendChild(li);
            });
        }

        // Render Images from ALL Subdirectories
        imageGallery.innerHTML = '';
        if (subDirs.length === 0) {
            imageGallery.innerHTML = '<p style="grid-column: 1 / -1;">এই অধ্যায়ে কোনো ছবির ফোল্ডার পাওয়া যায়নি।</p>';
        } else {
            let foundAnyImages = false;

            for (const dir of subDirs) {
                const dirResponse = await fetch(`${apiUrl}/${encodeURIComponent(dir.path)}`);
                const dirContents = await dirResponse.json();

                const images = dirContents.filter(item => item.name.match(/\.(png|jpg|jpeg|gif|svg)$/i));

                if (images.length > 0) {
                    foundAnyImages = true;

                    const folderHeading = document.createElement('h4');
                    folderHeading.textContent = `ফোল্ডার: ${dir.name}`;
                    folderHeading.style.gridColumn = '1 / -1'; 
                    folderHeading.style.marginTop = '15px';
                    folderHeading.style.paddingBottom = '5px';
                    folderHeading.style.borderBottom = '1px dashed #c5cae9';
                    folderHeading.style.color = '#4a148c';
                    folderHeading.style.fontSize = '1.1rem';
                    imageGallery.appendChild(folderHeading);

                    images.forEach(img => {
                        const imgUrl = `https://raw.githubusercontent.com/${USERNAME}/${REPO}/${BRANCH}/${img.path}`;
                        const card = document.createElement('div');
                        card.className = 'image-card';
                        card.innerHTML = `
                            <img src="${imgUrl}" alt="${img.name}">
                            <p style="font-size: 0.9em; margin-bottom: 8px; word-wrap: break-word;">${img.name}</p>
                            <button class="copy-btn" onclick="copyImageToClipboard('${imgUrl}')">ছবি কপি করুন</button>
                        `;
                        imageGallery.appendChild(card);
                    });
                }
            }

            if (!foundAnyImages) {
                imageGallery.innerHTML = '<p style="grid-column: 1 / -1;">ফোল্ডারগুলোতে কোনো ছবি পাওয়া যায়নি।</p>';
            }
        }

    } catch (error) {
        console.error(error);
        documentList.innerHTML = '<li style="color:#d32f2f; grid-column: 1 / -1;">ফাইলের তথ্য লোড করতে সমস্যা হয়েছে।</li>';
        imageGallery.innerHTML = '';
    }
}

// 3. COPY IMAGE LOGIC
async function copyImageToClipboard(imageUrl) {
    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        const item = new ClipboardItem({ [blob.type]: blob });
        await navigator.clipboard.write([item]);
        
        alert('ছবি সফলভাবে ক্লিপবোর্ডে কপি হয়েছে!');
    } catch (err) {
        console.error('Failed to copy image: ', err);
        alert('ছবি কপি করা যায়নি। ব্রাউজার সরাসরি গিটহাব লিঙ্ক থেকে কপি ব্লক করতে পারে, রাইট-ক্লিক করে কপি করার চেষ্টা করুন।');
    }
}

// Run on initial load
fetchChapters();